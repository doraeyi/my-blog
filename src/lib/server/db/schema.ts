import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
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

export const postRelations = relations(post, ({ one }) => ({
	author: one(user, { fields: [post.authorId], references: [user.id] })
}));

export * from './auth.schema';
