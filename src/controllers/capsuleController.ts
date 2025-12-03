import type { RequestHandler } from "express";

import {
  createCapsule,
  deleteCapsule,
  getCapsuleById,
  getCapsules,
  type CapsulePayload,
  updateCapsule,
} from "../services/capsuleService.js";

const parseString = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
};

const parseNumber = (value: unknown, fallback: number): number => {
  if (Array.isArray(value)) {
    return parseNumber(value[0], fallback);
  }
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseCoordinate = (value: unknown): number | undefined => {
  if (Array.isArray(value)) {
    return parseCoordinate(value[0]);
  }
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parsePositiveNumber = (value: unknown): number | undefined => {
  if (Array.isArray(value)) {
    return parsePositiveNumber(value[0]);
  }
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const parseDate = (value: unknown): Date | undefined => {
  if (Array.isArray(value)) {
    return parseDate(value[0]);
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const getCapsulesController: RequestHandler = async (req, res, next) => {
  try {
    const page = parseNumber(req.query.page, 1);
    const perPage = parseNumber(req.query.perPage, 10);

    const sortField = parseString(req.query.sortField) || "createdAt";
    const sortOrder = parseString(req.query.sortOrder) === "asc" ? 1 : -1;

    const availableAfter = parseDate(req.query.availableAfter);
    const availableBefore = parseDate(req.query.availableBefore);
    const userId = parseString(req.query.userId);
    const country = parseString(req.query.country);
    const city = parseString(req.query.city);
    const lat = parseCoordinate(req.query.lat);
    const lon = parseCoordinate(req.query.lon);
    const distance = parsePositiveNumber(req.query.distance);

    const result = await getCapsules({
      page,
      perPage,
      sort: { [sortField]: sortOrder as 1 | -1 },
      ...(userId ? { userId } : {}),
      ...(country ? { country } : {}),
      ...(city ? { city } : {}),
      ...(availableAfter ? { availableAfter } : {}),
      ...(availableBefore ? { availableBefore } : {}),
      ...(typeof lat === "number" ? { lat } : {}),
      ...(typeof lon === "number" ? { lon } : {}),
      ...(typeof distance === "number" ? { distance } : {}),
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getCapsuleByIdController: RequestHandler = async (req, res, next) => {
  try {
    const capsuleId = req.params.capsuleId;
    const result = await getCapsuleById(capsuleId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const createCapsuleController: RequestHandler = async (req, res, next) => {
  try {
    const payload = req.body as CapsulePayload;
    const result = await createCapsule(payload);

    console.log(result);
    
    res.status(201).json(result);
  } catch (err) {
    console.log(err);
    
    next(err);
  }
};

export const updateCapsuleController: RequestHandler = async (req, res, next) => {
  try {
    const capsuleId = req.params.capsuleId;
    const updates = req.body as Partial<CapsulePayload>;
    const result = await updateCapsule(capsuleId, updates);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteCapsuleController: RequestHandler = async (req, res, next) => {
  try {
    const capsuleId = req.params.capsuleId;
    const result = await deleteCapsule(capsuleId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
