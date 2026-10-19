import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

export const comment = sqliteTable('comment', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	postSlug: text('post_slug').notNull(),
	authorId: text('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	body: text('body').notNull(),
	status: text('status', { enum: ['visible', 'hidden'] })
		.notNull()
		.default('visible'),
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
