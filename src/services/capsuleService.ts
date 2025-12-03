import type { FilterQuery, PipelineStage } from "mongoose";
import createHttpError from "http-errors";

import { CapsuleCollection, type Capsule } from "../database/models/capsule.js";
import { calculatePaginationData } from "../utils/calculatePaginationData.js";

export type CapsulePayload = Pick<
  Capsule,
  "userId" | "location" | "timeToOpen" | "title" | "message" | "media" | "files"
>;

export type CapsuleQueryFilters = Partial<Pick<Capsule, "userId">> & {
  country?: string;
  city?: string;
  availableBefore?: Date;
  availableAfter?: Date;
  lat?: number;
  lon?: number;
  distance?: number;
};

export type CapsuleQueryOptions = CapsuleQueryFilters & {
  page?: number;
  perPage?: number;
  sort?: Record<string, 1 | -1>;
};

export const getCapsules = async ({
  page = 1,
  perPage = 10,
  sort = { createdAt: -1 },
  ...filters
}: CapsuleQueryOptions) => {
  const offset = (page - 1) * perPage;

  const query: FilterQuery<Capsule> = {};

  if (filters.userId) {
    query.userId = filters.userId;
  }

  if (filters.country) {
    query["location.country"] = { $regex: filters.country, $options: "i" };
  }

  if (filters.city) {
    query["location.city"] = { $regex: filters.city, $options: "i" };
  }

  if (filters.availableAfter || filters.availableBefore) {
    query.timeToOpen = {};

    if (filters.availableAfter) {
      query.timeToOpen.$gte = filters.availableAfter;
    }

    if (filters.availableBefore) {
      query.timeToOpen.$lte = filters.availableBefore;
    }
  }

  const basePipeline: PipelineStage[] = [{ $match: query }];

  const shouldFilterByDistance =
    typeof filters.lat === "number" &&
    typeof filters.lon === "number" &&
    typeof filters.distance === "number" &&
    filters.distance > 0;

  if (shouldFilterByDistance) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const userLatRad = toRad(filters.lat as number);
    const userLonRad = toRad(filters.lon as number);

    basePipeline.push(
      {
        $addFields: {
          distance: {
            $multiply: [
              6371,
              {
                $acos: {
                  $add: [
                    {
                      $multiply: [
                        { $sin: { $degreesToRadians: "$location.lat" } },
                        Math.sin(userLatRad),
                      ],
                    },
                    {
                      $multiply: [
                        { $cos: { $degreesToRadians: "$location.lat" } },
                        Math.cos(userLatRad),
                        {
                          $cos: {
                            $subtract: [
                              { $degreesToRadians: "$location.lon" },
                              userLonRad,
                            ],
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
      },
      {
        $match: {
          distance: { $lte: filters.distance },
        },
      }
    );
  }

  const totalResult = await CapsuleCollection.aggregate([
    ...basePipeline,
    { $count: "count" },
  ]);
  const totalCapsules = totalResult[0]?.count ?? 0;

  const capsules = await CapsuleCollection.aggregate([
    ...basePipeline,
    { $sort: sort },
    { $skip: offset },
    { $limit: perPage },
  ]);

  const paginationInfo = calculatePaginationData(totalCapsules, page, perPage);

  return {
    ...paginationInfo,
    capsules,
  };
};

export const getCapsuleById = async (capsuleId: string) => {
  const capsule = await CapsuleCollection.findById(capsuleId);

  if (!capsule) {
    throw createHttpError(404, "Capsule not found");
  }

  return capsule;
};

export const createCapsule = async (capsuleData: CapsulePayload) => {
  return CapsuleCollection.create(capsuleData);
};

export const updateCapsule = async (
  capsuleId: string,
  updates: Partial<CapsulePayload>
) => {
  const updatedCapsule = await CapsuleCollection.findByIdAndUpdate(
    capsuleId,
    updates,
    { new: true, runValidators: true }
  );

  if (!updatedCapsule) {
    throw createHttpError(404, "Capsule not found");
  }

  return updatedCapsule;
};

export const deleteCapsule = async (capsuleId: string) => {
  const deletedCapsule = await CapsuleCollection.findByIdAndDelete(capsuleId);

  if (!deletedCapsule) {
    throw createHttpError(404, "Capsule not found");
  }

  return deletedCapsule;
};
