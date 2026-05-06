import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Paper
} from "@mui/material";
import type { Notification, NotificationType } from "./types";
import { fetchNotifications, markNotificationRead } from "./api";
import { getTopNotifications } from "./priority";

const typeOptions: Array<NotificationType | "All"> = ["All", "Event", "Result", "Placement", "Reminder", "Announcement"];

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

export default function App() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tab, setTab] = useState<"all" | "unread" | "priority">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "All">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const items = await fetchNotifications();

        if (isActive) {
          setNotifications(items);
        }
      } catch (fetchError) {
        if (isActive) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load notifications");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, []);

  const visibleNotifications = useMemo(() => {
    let items = [...notifications];

    if (typeFilter !== "All") {
      items = items.filter((notification) => notification.type === typeFilter);
    }

    if (tab === "unread") {
      items = items.filter((notification) => !notification.isRead);
    }

    if (tab === "priority") {
      items = getTopNotifications(items, 10);
    }

    return items.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  }, [notifications, tab, typeFilter]);

  async function toggleRead(notification: Notification) {
    try {
      setUpdatingId(notification.id);
      const updated = await markNotificationRead(notification.id, !notification.isRead);
      setNotifications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #eefbf9 0%, #f6f7fb 100%)", py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, border: "1px solid rgba(15, 118, 110, 0.14)", mb: 3, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}>
          <Stack spacing={2} direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
            <Box>
              <Typography variant="overline" color="primary">Notification Center</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -0.8 }}>
                Priority inbox for students
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mt: 1 }}>
                Real-time notifications, read/unread state, type filtering, and a priority view for the most important updates.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`${notifications.length} total`} color="primary" />
              <Chip label={`${notifications.filter((notification) => !notification.isRead).length} unread`} color="secondary" />
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid rgba(15, 118, 110, 0.14)" }}>
          <Stack spacing={2} direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
            <Tabs value={tab} onChange={(_, value) => setTab(value)}>
              <Tab value="all" label="All notifications" />
              <Tab value="unread" label="Unread only" />
              <Tab value="priority" label="Priority top 10" />
            </Tabs>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Filter by type</InputLabel>
              <Select label="Filter by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as NotificationType | "All") }>
                {typeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

        {loading ? (
          <Stack alignItems="center" sx={{ py: 10 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Grid container spacing={2}>
            {visibleNotifications.map((notification) => (
              <Grid key={notification.id} item xs={12} md={6} lg={4}>
                <Card variant="outlined" sx={{ height: "100%", borderColor: notification.isRead ? "rgba(0,0,0,0.12)" : "primary.main", background: notification.isRead ? "#fff" : "linear-gradient(180deg, #ffffff 0%, #f0fbf9 100%)" }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>{notification.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Student {notification.studentId} • {formatTime(notification.createdAt)}
                          </Typography>
                        </Box>
                        <Chip size="small" color={notification.isRead ? "default" : "primary"} label={notification.isRead ? "Seen" : "New"} />
                      </Stack>

                      <Typography variant="body1" color="text.primary">
                        {notification.message}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip size="small" label={notification.type} />
                        <Chip size="small" label={`Priority ${notification.priorityScore}`} color="secondary" variant="outlined" />
                        <Chip size="small" label={notification.source.toUpperCase()} variant="outlined" />
                      </Stack>

                      <Button variant="contained" onClick={() => void toggleRead(notification)} disabled={updatingId === notification.id} sx={{ alignSelf: "flex-start" }}>
                        {notification.isRead ? "Mark unread" : "Mark read"}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && visibleNotifications.length === 0 ? (
          <Alert severity="info" sx={{ mt: 3 }}>
            No notifications match the current filters.
          </Alert>
        ) : null}
      </Container>
    </Box>
  );
}