import { pgTable, text, timestamp, boolean, uuid, numeric, integer, date } from "drizzle-orm/pg-core";
export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').notNull(),
    image: text('image'),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
    // Custom fields added via additionalFields
    phone: text('phone'),
    role: text('role', { enum: ['sales', 'manager', 'admin'] }),
    status: text('status', { enum: ['active', 'inactive'] })
});
export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId').notNull().references(() => user.id)
});
export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId').notNull().references(() => user.id),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull()
});
export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    createdAt: timestamp('createdAt'),
    updatedAt: timestamp('updatedAt')
});
export const customer = pgTable("customer", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category", { enum: ['enterprise', 'sme', 'saas'] }),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});
export const attendance = pgTable("attendance", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => user.id),
    date: date("date").notNull(),
    checkInTime: timestamp("check_in_time"),
    checkOutTime: timestamp("check_out_time"),
    checkInPhoto: text("check_in_photo"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    address: text("address"),
    isOutsideGeofence: boolean("is_outside_geofence").default(false),
    distanceFromOffice: numeric("distance_from_office", { precision: 10, scale: 2 }),
    status: text("status", { enum: ['hadir', 'terlambat', 'izin', 'alpha'] }),
    scheduledStart: text("scheduled_start"),
    scheduledEnd: text("scheduled_end"),
    createdAt: timestamp("created_at").defaultNow()
});
export const leaveRequest = pgTable("leave_request", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => user.id),
    type: text("type", { enum: ['sakit', 'cuti', 'keperluan'] }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reason: text("reason"),
    attachmentUrl: text("attachment_url"),
    status: text("status", { enum: ['pending', 'approved', 'rejected'] }).default('pending'),
    approvedBy: text("approved_by").references(() => user.id),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});
export const activity = pgTable("activity", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => user.id),
    customerId: uuid("customer_id").references(() => customer.id),
    type: text("type", { enum: ['visit', 'call', 'meeting', 'demo'] }).notNull(),
    summary: text("summary"),
    notes: text("notes"),
    dealStatus: text("deal_status", { enum: ['Prospek', 'Negosiasi', 'Closing', 'Lose'] }),
    dealValue: numeric("deal_value", { precision: 15, scale: 2 }),
    attachmentUrls: text("attachment_urls").array(),
    activityDate: timestamp("activity_date").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});
export const deal = pgTable("deal", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => user.id),
    customerId: uuid("customer_id").references(() => customer.id),
    title: text("title"),
    value: numeric("value", { precision: 15, scale: 2 }).notNull(),
    category: text("category", { enum: ['enterprise', 'sme', 'saas', 'software', 'hardware'] }),
    stage: text("stage", { enum: ['prospek', 'negosiasi', 'closing', 'lose'] }).notNull(),
    priority: text("priority", { enum: ['normal', 'hot'] }),
    loseReason: text("lose_reason"),
    closedAt: timestamp("closed_at"),
    expectedCloseDate: date("expected_close_date"),
    approvalStatus: text("approval_status", { enum: ['none', 'pending', 'approved', 'rejected'] }).default('none'),
    approvedBy: text("approved_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});
export const globalTarget = pgTable("global_target", {
    id: uuid("id").primaryKey().defaultRandom(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    targetAmount: numeric("target_amount", { precision: 15, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});
export const officeSettings = pgTable("office_settings", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    radiusMeters: integer("radius_meters").notNull().default(2000),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});
