import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    manageToken: text("manage_token").notNull(),
    organizerName: text("organizer_name").notNull(),
    title: text("title").notNull(),
    city: text("city").notNull(),
    maxPlaces: integer("max_places").notNull(),
    budgetEur: integer("budget_eur"),
    responseDeadline: text("response_deadline"),
    confirmedDateId: text("confirmed_date_id"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("events_slug_unique").on(table.slug),
    uniqueIndex("events_manage_token_unique").on(table.manageToken),
  ],
);

export const places = sqliteTable(
  "places",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    startTime: text("start_time"),
    mapsUrl: text("maps_url").notNull(),
    name: text("name").notNull(),
    rating: text("rating"),
    ratingLabel: text("rating_label"),
    address: text("address"),
    category: text("category"),
    hours: text("hours"),
    image: text("image"),
  },
  (table) => [uniqueIndex("places_event_position_unique").on(table.eventId, table.position)],
);

export const dateOptions = sqliteTable(
  "date_options",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    startsAt: text("starts_at").notNull(),
  },
  (table) => [uniqueIndex("date_options_event_position_unique").on(table.eventId, table.position)],
);

export const participants = sqliteTable(
  "participants",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    name: text("name").notNull(),
    role: text("role", { enum: ["organizer", "guest"] }).notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("participants_event_token_unique").on(table.eventId, table.token),
  ],
);

export const votes = sqliteTable(
  "votes",
  {
    participantId: text("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    dateOptionId: text("date_option_id")
      .notNull()
      .references(() => dateOptions.id, { onDelete: "cascade" }),
    available: integer("available", { mode: "boolean" }).notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.participantId, table.dateOptionId] })],
);

export const stageVotes = sqliteTable(
  "stage_votes",
  {
    participantId: text("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    placeId: text("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    attending: integer("attending", { mode: "boolean" }).notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.participantId, table.placeId] }),
    index("idx_stage_votes_place_id").on(table.placeId),
  ],
);
