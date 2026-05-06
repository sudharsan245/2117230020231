type NotificationType = "Event" | "Result" | "Placement";

export interface ApiNotification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

export interface RankedNotification extends ApiNotification {
  score: number;
}

const TYPE_WEIGHT: Record<NotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1
};

class MinHeap<T> {
  private items: T[] = [];

  constructor(private readonly compare: (left: T, right: T) => number) {}

  size() {
    return this.items.length;
  }

  peek() {
    return this.items[0];
  }

  push(value: T) {
    this.items.push(value);
    this.bubbleUp(this.items.length - 1);
  }

  replaceRoot(value: T) {
    if (this.items.length === 0) {
      this.items.push(value);
      return;
    }

    this.items[0] = value;
    this.bubbleDown(0);
  }

  values() {
    return [...this.items];
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);

      if (this.compare(this.items[index], this.items[parentIndex]) >= 0) {
        break;
      }

      [this.items[index], this.items[parentIndex]] = [this.items[parentIndex], this.items[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number) {
    while (true) {
      const leftIndex = index * 2 + 1;
      const rightIndex = leftIndex + 1;
      let smallest = index;

      if (leftIndex < this.items.length && this.compare(this.items[leftIndex], this.items[smallest]) < 0) {
        smallest = leftIndex;
      }

      if (rightIndex < this.items.length && this.compare(this.items[rightIndex], this.items[smallest]) < 0) {
        smallest = rightIndex;
      }

      if (smallest === index) {
        break;
      }

      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      index = smallest;
    }
  }
}

function rank(notification: ApiNotification) {
  const timeWeight = Date.parse(notification.Timestamp);
  return TYPE_WEIGHT[notification.Type] * 1_000_000_000_000 + timeWeight;
}

function toRanked(notification: ApiNotification): RankedNotification {
  return {
    ...notification,
    score: rank(notification)
  };
}

function compareRanked(left: RankedNotification, right: RankedNotification) {
  return left.score - right.score;
}

export function topNotifications(notifications: ApiNotification[], limit = 10) {
  const heap = new MinHeap<RankedNotification>(compareRanked);

  for (const notification of notifications) {
    const ranked = toRanked(notification);

    if (heap.size() < limit) {
      heap.push(ranked);
      continue;
    }

    const currentLowest = heap.peek();

    if (currentLowest && ranked.score > currentLowest.score) {
      heap.replaceRoot(ranked);
    }
  }

  return heap
    .values()
    .sort((left, right) => right.score - left.score)
    .map(({ score, ...notification }) => notification);
}

export async function fetchPriorityInbox() {
  const apiUrl = process.env.NOTIFICATION_API_URL ?? "http://20.207.122.201/evaluation-service/notifications";
  const response = await fetch(apiUrl, {
    headers: process.env.NOTIFICATION_API_TOKEN
      ? {
          Authorization: `Bearer ${process.env.NOTIFICATION_API_TOKEN}`
        }
      : undefined
  });

  if (!response.ok) {
    throw new Error(`Notification API failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { notifications?: ApiNotification[] };
  const notifications = payload.notifications ?? [];

  return topNotifications(notifications, Number(process.env.PRIORITY_LIMIT ?? 10));
}

async function main() {
  const notifications = await fetchPriorityInbox();

  console.log(`Top ${notifications.length} priority notifications`);
  for (const notification of notifications) {
    console.log(`${notification.Type} | ${notification.Message} | ${notification.Timestamp}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}