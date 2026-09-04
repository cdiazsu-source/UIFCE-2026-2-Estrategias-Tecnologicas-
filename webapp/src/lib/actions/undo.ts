"use server";

import { revalidatePath } from "next/cache";

import type { SocialChannelStatus, SocialOfficialStatus, SocialPlatform } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import type { UndoAction } from "@/lib/undo";

/** Revierte la última acción a partir del descriptor que guardó el banner. */
export async function applyUndo(action: UndoAction) {
  const junior = await blockedForJunior();
  // El perfil junior solo puede deshacer lo que puede hacer: notas de bitácora.
  if (junior && !action.kind.startsWith("note.")) return;

  switch (action.kind) {
    case "note.delete": {
      const d = action.data;
      await prisma.projectNote.create({
        data: {
          id: d.id,
          projectId: d.projectId,
          body: d.body,
          author: d.author,
          authorRole: d.authorRole,
          authorId: d.authorId,
          checklistItemId: d.checklistItemId,
          mentionIds: d.mentionIds,
          createdAt: new Date(d.createdAt),
        },
      });
      revalidatePath(`/proyectos/${d.projectId}`);
      break;
    }
    case "note.update": {
      await prisma.projectNote.update({
        where: { id: action.id },
        data: {
          body: action.before.body,
          checklistItemId: action.before.checklistItemId,
          mentionIds: action.before.mentionIds,
        },
      });
      revalidatePath(`/proyectos/${action.projectId}`);
      break;
    }
    case "checklist.delete": {
      const d = action.data;
      await prisma.checklistItem.create({
        data: {
          id: d.id,
          projectId: d.projectId,
          text: d.text,
          order: d.order,
          done: d.done,
          assignee: d.assignee,
          assigneeId: d.assigneeId,
          dueDate: d.dueDate ? new Date(d.dueDate) : null,
          mentionIds: d.mentionIds,
        },
      });
      revalidatePath(`/proyectos/${d.projectId}`);
      break;
    }
    case "checklist.update": {
      await prisma.checklistItem.update({
        where: { id: action.id },
        data: {
          text: action.before.text,
          assignee: action.before.assignee,
          assigneeId: action.before.assigneeId,
          dueDate: action.before.dueDate ? new Date(action.before.dueDate) : null,
          mentionIds: action.before.mentionIds,
        },
      });
      revalidatePath(`/proyectos/${action.projectId}`);
      break;
    }
    case "checklist.toggle": {
      await prisma.checklistItem.update({ where: { id: action.id }, data: { done: action.before } });
      revalidatePath(`/proyectos/${action.projectId}`);
      break;
    }
    case "project.content": {
      await prisma.project.update({ where: { id: action.id }, data: action.before });
      revalidatePath(`/proyectos/${action.id}`);
      break;
    }
    case "project.tags": {
      await prisma.project.update({ where: { id: action.id }, data: { tags: action.before } });
      revalidatePath(`/proyectos/${action.id}`);
      break;
    }
    case "social.update": {
      const b = action.before;
      await prisma.socialChannel.update({
        where: { id: action.id },
        data: {
          handle: b.handle,
          url: b.url,
          status: b.status as SocialChannelStatus,
          officialStatus: b.officialStatus as SocialOfficialStatus,
          followers: b.followers,
          cadence: b.cadence,
          lastPostAt: b.lastPostAt ? new Date(b.lastPostAt) : null,
          lastPostNote: b.lastPostNote,
          nextAction: b.nextAction,
          notes: b.notes,
          responsibleId: b.responsibleId,
        },
      });
      revalidatePath("/redes");
      break;
    }
    case "social.delete": {
      const d = action.data;
      await prisma.socialChannel.create({
        data: {
          id: d.id,
          platform: d.platform as SocialPlatform,
          handle: d.handle,
          url: d.url,
          status: d.status as SocialChannelStatus,
          officialStatus: d.officialStatus as SocialOfficialStatus,
          followers: d.followers,
          cadence: d.cadence,
          lastPostAt: d.lastPostAt ? new Date(d.lastPostAt) : null,
          lastPostNote: d.lastPostNote,
          nextAction: d.nextAction,
          notes: d.notes,
          responsibleId: d.responsibleId,
          projectId: d.projectId,
          order: d.order,
        },
      });
      revalidatePath("/redes");
      break;
    }
    case "socialinteraction.update": {
      const b = action.before;
      await prisma.socialInteraction.update({
        where: { id: action.id },
        data: {
          at: new Date(b.at),
          title: b.title,
          detail: b.detail,
          followers: b.followers,
          reach: b.reach,
          interactions: b.interactions,
          url: b.url,
        },
      });
      revalidatePath("/redes");
      break;
    }
    case "socialinteraction.delete": {
      const d = action.data;
      await prisma.socialInteraction.create({
        data: {
          id: d.id,
          channelId: d.channelId,
          at: new Date(d.at),
          title: d.title,
          detail: d.detail,
          followers: d.followers,
          reach: d.reach,
          interactions: d.interactions,
          url: d.url,
        },
      });
      revalidatePath("/redes");
      break;
    }
    case "template.update": {
      await prisma.template.update({ where: { id: action.id }, data: action.before });
      revalidatePath("/plantillas");
      break;
    }
    case "template.delete": {
      await prisma.template.create({ data: action.data });
      revalidatePath("/plantillas");
      break;
    }
    case "teamcomment.delete": {
      const d = action.data;
      await prisma.teamComment.create({
        data: {
          id: d.id,
          body: d.body,
          author: d.author,
          authorRole: d.authorRole,
          authorId: d.authorId,
          reviewed: d.reviewed,
          createdAt: new Date(d.createdAt),
        },
      });
      revalidatePath("/");
      break;
    }
    case "teamcomment.reviewed": {
      await prisma.teamComment.update({ where: { id: action.id }, data: { reviewed: action.before } });
      revalidatePath("/");
      break;
    }
  }

  revalidatePath("/");
}
