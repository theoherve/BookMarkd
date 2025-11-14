"use client";

import { useQuery } from "@tanstack/react-query";

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type TagsResponse = {
  tags: Tag[];
};

const fetchTags = async (): Promise<TagsResponse> => {
  const response = await fetch("/api/tags", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors du chargement des tags.");
  }

  return response.json();
};

export const useTagsQuery = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
    staleTime: 1000 * 60 * 60, // 1h
  });
};

