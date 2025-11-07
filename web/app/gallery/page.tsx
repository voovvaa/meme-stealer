"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Tilt from "react-parallax-tilt";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type GalleryPost = {
  id: number;
  hash: string;
  filePath: string;
  createdAt: string;
};

// Компонент с параллакс эффектом
function ParallaxCard({
  post,
  index
}: {
  post: GalleryPost;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Отменяем предыдущий запрос анимации для оптимизации
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const cardCenter = rect.top + rect.height / 2;

        // Вычисляем смещение относительно центра экрана
        // Чем дальше от центра, тем больше смещение
        const offset = (windowHeight / 2 - cardCenter) * 0.05;
        setParallaxOffset(offset);
      });
    };

    // Используем passive для лучшей производительности
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Инициализация

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="break-inside-avoid mb-4"
      style={{
        transform: `translate3d(0, ${parallaxOffset}px, 0)`,
        transition: 'transform 0.15s cubic-bezier(0.33, 1, 0.68, 1)',
        willChange: 'transform'
      }}
    >
      <Tilt
        tiltMaxAngleX={5}
        tiltMaxAngleY={5}
        scale={1.02}
        transitionSpeed={350}
        glareEnable={true}
        glareMaxOpacity={0.12}
        glareColor="rgba(255, 255, 255, 0.3)"
        glarePosition="all"
        className="w-full"
      >
        <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-2xl">
          <img
            src={`/api/media/${post.filePath.replace(/^media\//, '')}`}
            alt={`Мем ${post.hash}`}
            className="w-full h-auto select-none transform-gpu"
            loading="lazy"
            draggable={false}
          />
        </Card>
      </Tilt>
    </div>
  );
}

// Скелетон для загрузки с shimmer эффектом
function SkeletonCard({ index }: { index: number }) {
  const heights = [280, 320, 240, 360, 300];
  const height = heights[index % heights.length];

  return (
    <div className="break-inside-avoid mb-4">
      <Card className="overflow-hidden relative">
        <div
          className="w-full bg-muted relative overflow-hidden"
          style={{ height: `${height}px` }}
        >
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </Card>
    </div>
  );
}

export default function GalleryPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
    } finally {
      setLoading(false);
      setInitialLoading(false);
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
          Бесконечная лента опубликованных мемов с параллакс эффектом
        </p>
      </div>

      {initialLoading ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonCard key={index} index={index} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            Пока нет опубликованных мемов
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {posts.map((post, index) => (
            <ParallaxCard
              key={post.id}
              post={post}
              index={index}
            />
          ))}
        </div>
      )}

      {loading && !initialLoading && (
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
