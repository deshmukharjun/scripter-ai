'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';
import { Loader } from '@/components/Loader';
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GeneratedVideo } from '@/lib/api';
import { VideoCard } from '@/components/VideoCard';

const ITEMS_PER_PAGE = 12;

export default function VideosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchVideos = useCallback(async () => {
    if (!user || !db) return;

    setLoading(true);
    setError('');

    try {
      const q = query(
        collection(db, 'videos'),
        where('userId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const videosList: GeneratedVideo[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        videosList.push({
          id: doc.id,
          userId: data.userId,
          videoId: data.videoId,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
          originalScript: data.originalScript,
          cleanedScript: data.cleanedScript,
          title: data.title,
          status: data.status || 'completed',
          createdAt: data.createdAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
        });
      });

      // Sort by timestamp in descending order (newest first)
      videosList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setVideos(videosList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch videos');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user, fetchVideos]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?') || !db) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'videos', id));
      setVideos(videos.filter((v) => v.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete video');
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalPages = Math.ceil(videos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVideos = videos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Generated Videos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your generated videos
          </p>
          {videos.length > 0 && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {videos.length} {videos.length === 1 ? 'video' : 'videos'}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl animate-shake">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {videos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 sm:p-16 text-center border border-gray-200 dark:border-gray-700">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No videos yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Generate your first video from a script to see it here!
              </p>
              <a
                href="/generate"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                <span>Generate Scripts</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedVideos.map((video, index) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onDelete={handleDelete}
                  deleting={deletingId === video.id}
                  index={index}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </button>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none shadow-md"
                >
                  <span>Next</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

