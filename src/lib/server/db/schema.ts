import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

/** A project written up as a closed case: what was wrong, how it was traced, what fixed it. */
export interface CaseReport {
	/** One line: the project's purpose or the brief. */
	brief: string;
	/** Liam's part in it (solo, frontend lead, …). */
	role: string;
	/** Markdown sections. */
	problem: string;
	investigation: string;
	solution: string;
	result: string;
}

export const comment = sqliteTable('comment', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	postSlug: text('post_slug').notNull(),
	authorId: text('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	body: text('body').notNull(),
	/** Set on replies: the top-level comment this answers (threads are one level deep). */
	parentId: text('parent_id'),
	status: text('status', { enum: ['visible', 'hidden'] })
		.notNull()
		.default('visible'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

/** In-site notices, e.g. "someone replied to your comment". Read ones are kept. */
export const notification = sqliteTable('notification', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	actorName: text('actor_name').notNull(),
	/** What happened, already phrased, e.g. "回覆了你在《…》的留言". */
	summary: text('summary').notNull(),
	/** A short quote of the new text. */
	excerpt: text('excerpt'),
	url: text('url').notNull(),
	readAt: integer('read_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const postReaction = sqliteTable(
	'post_reaction',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		postSlug: text('post_slug').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [uniqueIndex('post_reaction_slug_user_idx').on(t.postSlug, t.userId)]
);

export const commentRelations = relations(comment, ({ one }) => ({
	author: one(user, { fields: [comment.authorId], references: [user.id] })
}));

export const postReactionRelations = relations(postReaction, ({ one }) => ({
	user: one(user, { fields: [postReaction.userId], references: [user.id] })
}));

export const project = sqliteTable(
	'project',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		githubOwner: text('github_owner').notNull(),
		githubRepo: text('github_repo').notNull(),
		description: text('description'),
		homepageUrl: text('homepage_url'),
		readmeHtml: text('readme_html'),
		/** Hand-written 結案報告 (Markdown per section); null until written in the admin. */
		caseReport: text('case_report', { mode: 'json' }).$type<CaseReport | null>(),
		starCount: integer('star_count').notNull().default(0),
		lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [uniqueIndex('project_owner_repo_idx').on(t.githubOwner, t.githubRepo)]
);

export const projectCollaborator = sqliteTable(
	'project_collaborator',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		githubUsername: text('github_username').notNull(),
		avatarUrl: text('avatar_url'),
		profileUrl: text('profile_url'),
		role: text('role', { enum: ['owner', 'collaborator'] }).notNull()
	},
	(t) => [uniqueIndex('project_collaborator_idx').on(t.projectId, t.githubUsername)]
);

export const projectCommitDaily = sqliteTable(
	'project_commit_daily',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		date: text('date').notNull(),
		count: integer('count').notNull().default(0)
	},
	(t) => [uniqueIndex('project_commit_daily_idx').on(t.projectId, t.date)]
);

export const projectRelations = relations(project, ({ many }) => ({
	collaborators: many(projectCollaborator),
	commitDaily: many(projectCommitDaily)
}));

export const projectCollaboratorRelations = relations(projectCollaborator, ({ one }) => ({
	project: one(project, { fields: [projectCollaborator.projectId], references: [project.id] })
}));

export const projectCommitDailyRelations = relations(projectCommitDaily, ({ one }) => ({
	project: one(project, { fields: [projectCommitDaily.projectId], references: [project.id] })
}));

export const post = sqliteTable(
	'post',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		kind: text('kind', { enum: ['article', 'mood'] }).notNull(),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		excerpt: text('excerpt'),
		body: text('body').notNull(),
		tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
		series: text('series'),
		published: integer('published', { mode: 'boolean' }).notNull().default(false),
		authorId: text('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [uniqueIndex('post_kind_slug_idx').on(t.kind, t.slug)]
);

// One row per piece of content, keyed the same way as comments/reactions
// (`blog slug`, `article/<slug>`, `mood/<slug>`).
export const pageView = sqliteTable('page_view', {
	key: text('key').primaryKey(),
	count: integer('count').notNull().default(0)
});

export const postRelations = relations(post, ({ one }) => ({
	author: one(user, { fields: [post.authorId], references: [user.id] })
}));

export const watchItem = sqliteTable(
	'watch_item',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		tmdbId: integer('tmdb_id').notNull(),
		mediaType: text('media_type', { enum: ['movie', 'tv'] }).notNull(),
		title: text('title').notNull(),
		overview: text('overview'),
		posterPath: text('poster_path'),
		backdropPath: text('backdrop_path'),
		releaseDate: text('release_date'),
		voteAverage: real('vote_average'),
		status: text('status', { enum: ['watching', 'watched'] })
			.notNull()
			.default('watching'),
		currentSeason: integer('current_season'),
		currentEpisode: integer('current_episode'),
		totalSeasons: integer('total_seasons'),
		totalEpisodes: integer('total_episodes'),
		watchedAt: integer('watched_at', { mode: 'timestamp' }),
		/** Last "still watching" ping from the browser script — drives the live badge. */
		lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [uniqueIndex('watch_item_tmdb_idx').on(t.tmdbId, t.mediaType)]
);

export const watchItemCast = sqliteTable(
	'watch_item_cast',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		watchItemId: text('watch_item_id')
			.notNull()
			.references(() => watchItem.id, { onDelete: 'cascade' }),
		tmdbPersonId: integer('tmdb_person_id').notNull(),
		name: text('name').notNull(),
		character: text('character'),
		profilePath: text('profile_path'),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [uniqueIndex('watch_item_cast_idx').on(t.watchItemId, t.tmdbPersonId)]
);

export const watchItemRelations = relations(watchItem, ({ many }) => ({
	cast: many(watchItemCast)
}));

export const watchItemCastRelations = relations(watchItemCast, ({ one }) => ({
	item: one(watchItem, { fields: [watchItemCast.watchItemId], references: [watchItem.id] })
}));

export * from './auth.schema';

// 碎念 — short, title-less posts (a thought, a link, a one-liner). Published as
// soon as they're written; there's no draft state for something this small.
export const thought = sqliteTable('thought', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	body: text('body').notNull(),
	linkUrl: text('link_url'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// 線人名單 — friend links. Visitors apply through /friends (status "pending"),
// the owner approves or rejects in /admin/friends. The health fields are kept
// up to date by the periodic check in friends-service.
export const friend = sqliteTable('friend', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	url: text('url').notNull().unique(),
	avatar: text('avatar'),
	description: text('description').notNull(),
	/** Private: only the owner sees it. */
	email: text('email'),
	/** RSS / Atom feed; discovered from the site when left empty. */
	feedUrl: text('feed_url'),
	/** The page on their site that links back here. */
	backlinkUrl: text('backlink_url'),
	/** Show their latest posts in 朋友圈. */
	joinCircle: integer('join_circle', { mode: 'boolean' }).notNull().default(true),
	groupName: text('group_name').notNull().default('朋友'),
	sortOrder: integer('sort_order').notNull().default(0),
	status: text('status', { enum: ['pending', 'approved', 'rejected', 'hidden'] })
		.notNull()
		.default('pending'),
	/** Shown to the applicant on their status page. */
	reviewNote: text('review_note'),
	/** Owner's private note. */
	adminNote: text('admin_note'),
	/** Secret for the applicant's status page. */
	token: text('token')
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	checkedAt: integer('checked_at', { mode: 'timestamp' }),
	/** HTTP status of the last check, 0 when unreachable. */
	httpStatus: integer('http_status'),
	latencyMs: integer('latency_ms'),
	lastOkAt: integer('last_ok_at', { mode: 'timestamp' }),
	/** null = not checked (no backlink page given or not reachable). */
	backlinkOk: integer('backlink_ok', { mode: 'boolean' }),
	feedFetchedAt: integer('feed_fetched_at', { mode: 'timestamp' }),
	feedError: text('feed_error'),
	approvedAt: integer('approved_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// 朋友圈 — the latest posts pulled from each friend's feed.
export const friendPost = sqliteTable(
	'friend_post',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		friendId: text('friend_id')
			.notNull()
			.references(() => friend.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		url: text('url').notNull(),
		summary: text('summary'),
		publishedAt: integer('published_at', { mode: 'timestamp' }).notNull()
	},
	(t) => [uniqueIndex('friend_post_friend_url').on(t.friendId, t.url)]
);

export const friendRelations = relations(friend, ({ many }) => ({
	posts: many(friendPost)
}));

export const friendPostRelations = relations(friendPost, ({ one }) => ({
	friend: one(friend, { fields: [friendPost.friendId], references: [friend.id] })
}));

// 流量 — daily rollups only. Nothing identifies a visitor: unique visitors are
// counted from an in-memory hash that's thrown away at the end of each day.
export const trafficDaily = sqliteTable(
	'traffic_daily',
	{
		/** YYYY-MM-DD, Asia/Taipei. */
		day: text('day').notNull(),
		path: text('path').notNull(),
		views: integer('views').notNull().default(0)
	},
	(t) => [uniqueIndex('traffic_daily_day_path').on(t.day, t.path)]
);

export const visitsDaily = sqliteTable('visits_daily', {
	day: text('day').primaryKey(),
	views: integer('views').notNull().default(0),
	visitors: integer('visitors').notNull().default(0)
});

export const referrerDaily = sqliteTable(
	'referrer_daily',
	{
		day: text('day').notNull(),
		/** Normalised source: "Google", "Threads", or the referring host. */
		source: text('source').notNull(),
		views: integer('views').notNull().default(0)
	},
	(t) => [uniqueIndex('referrer_daily_day_source').on(t.day, t.source)]
);

// 電子報 — double opt-in: a subscriber is "pending" until they click the link
// in the confirmation email. The token doubles as the unsubscribe key.
export const subscriber = sqliteTable('subscriber', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	email: text('email').notNull().unique(),
	status: text('status', { enum: ['pending', 'active', 'unsubscribed'] })
		.notNull()
		.default('pending'),
	token: text('token')
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	confirmSentAt: integer('confirm_sent_at', { mode: 'timestamp' }),
	confirmedAt: integer('confirmed_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

/** One row per post that went out by email, so nothing is ever sent twice. */
export const newsletterIssue = sqliteTable('newsletter_issue', {
	/** The content key of the post (same as comments/likes/views). */
	key: text('key').primaryKey(),
	title: text('title').notNull(),
	recipients: integer('recipients').notNull(),
	sentAt: integer('sent_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// 被引用 — other pages that link to a post: Webmentions sent to /webmention,
// plus friends' feed posts that link here (found while refreshing 朋友圈).
export const webmention = sqliteTable(
	'webmention',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		source: text('source').notNull(),
		/** Path on this site that was linked, e.g. /articles/foo. */
		target: text('target').notNull(),
		kind: text('kind', { enum: ['mention', 'reply', 'like', 'repost'] })
			.notNull()
			.default('mention'),
		status: text('status', { enum: ['pending', 'verified', 'hidden', 'invalid'] })
			.notNull()
			.default('pending'),
		authorName: text('author_name'),
		authorUrl: text('author_url'),
		authorPhoto: text('author_photo'),
		title: text('title'),
		/** The sentence around the link on their page. */
		excerpt: text('excerpt'),
		/** Set when the source is an approved friend. */
		friendId: text('friend_id').references(() => friend.id, { onDelete: 'set null' }),
		verifiedAt: integer('verified_at', { mode: 'timestamp' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [uniqueIndex('webmention_source_target').on(t.source, t.target)]
);
