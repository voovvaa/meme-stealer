"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type GalleryPost = {
  id: number;
  hash: string;
  filePath: string;
  createdAt: string;
};

export default function GalleryPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadPosts = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch(`/api/gallery?page=${pageNum}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      setPosts(prev => pageNum === 1 ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  useEffect(() => {
    if (page > 1) {
      loadPosts(page);
    }
  }, [page, loadPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Галерея мемов</h1>
        <p className="text-muted-foreground">
          Бесконечная лента опубликованных мемов
        </p>
      </div>

      {posts.length === 0 && !loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            Пока нет опубликованных мемов
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {posts.map((post, index) => (
            <Card
              key={post.id}
              className="break-inside-avoid overflow-hidden hover:ring-2 hover:ring-primary transition-all duration-300 animate-fadeIn"
              style={{ animationDelay: `${(index % 20) * 50}ms` }}
            >
              <img
                src={`/api/media/${post.filePath}`}
                alt={`Мем ${post.hash}`}
                className="w-full h-auto"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </Card>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div ref={observerTarget} className="h-20" />

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Все мемы загружены
        </div>
      )}
    </div>
  );
}
