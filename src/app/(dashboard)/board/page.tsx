'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FileText, Paperclip, Plus, Loader2, Download, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PostForm } from '@/components/board/post-form';
import { getPosts, deletePost, getPostFileUrl, type PostWithAuthor } from '@/lib/actions/board';
import { getCurrentProfile } from '@/lib/actions/user';
import { toast } from 'sonner';

export default function BoardPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<PostWithAuthor | null>(null);
  const [editPost, setEditPost] = useState<PostWithAuthor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PostWithAuthor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);
    const [postsRes, profileRes] = await Promise.all([
      getPosts(),
      getCurrentProfile(),
    ]);
    if (postsRes.success && postsRes.data) {
      setPosts(postsRes.data);
    }
    if (profileRes.success && profileRes.data) {
      setCurrentUserId(profileRes.data.id);
      setIsAdmin(profileRes.data.role === 'admin');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const canManage = (post: PostWithAuthor) => isAdmin || post.author_id === currentUserId;

  const handleDownload = async (post: PostWithAuthor) => {
    if (!post.file_path) return;
    setIsDownloading(true);
    try {
      const res = await getPostFileUrl(post.file_path);
      if (!res.success || !res.data) {
        toast.error('파일 다운로드 링크 생성에 실패했습니다.');
        return;
      }
      window.open(res.data, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deletePost(deleteTarget.id, deleteTarget.file_path);
      if (!res.success) {
        toast.error('게시글 삭제 중 오류가 발생했습니다.');
        return;
      }
      toast.success('게시글이 삭제되었습니다.');
      setDeleteTarget(null);
      setDetailPost(null);
      fetchPosts();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">문서 공유 게시판</h1>
          <p className="text-sm text-muted-foreground">계획서 양식 등 공유가 필요한 문서를 올리고 다운로드합니다.</p>
        </div>
        <Button className="w-full sm:w-auto shadow-sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          새 글 작성
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4 cursor-pointer"
              onClick={() => setDetailPost(post)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="bg-primary/10 text-primary h-10 w-10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate flex items-center gap-1.5">
                    {post.title}
                    {post.file_path && <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.author_name} · {format(new Date(post.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12 bg-card border rounded-xl shadow-sm text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>등록된 게시글이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 새 글 작성 다이얼로그 */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>새 글 작성</DialogTitle>
            <DialogDescription>문서를 첨부해 공유할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <PostForm
            onSuccess={() => {
              setIsAddOpen(false);
              fetchPosts();
            }}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 상세보기 다이얼로그 */}
      <Dialog open={!!detailPost} onOpenChange={(open) => !open && setDetailPost(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{detailPost?.title}</DialogTitle>
            <DialogDescription>
              {detailPost && `${detailPost.author_name} · ${format(new Date(detailPost.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}`}
            </DialogDescription>
          </DialogHeader>
          {detailPost && (
            <div className="space-y-4 py-2">
              <p className="text-sm whitespace-pre-wrap">{detailPost.content}</p>
              {detailPost.file_path && (
                <Button variant="outline" className="w-full" onClick={() => handleDownload(detailPost)} disabled={isDownloading}>
                  {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  {detailPost.file_name} 다운로드
                </Button>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            {detailPost && canManage(detailPost) && (
              <>
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(detailPost)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </Button>
                <Button onClick={() => { setEditPost(detailPost); setDetailPost(null); }}>수정</Button>
              </>
            )}
            <Button variant="outline" onClick={() => setDetailPost(null)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editPost} onOpenChange={(open) => !open && setEditPost(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>게시글 수정</DialogTitle>
            <DialogDescription>제목과 내용을 수정합니다. (첨부파일은 변경할 수 없습니다)</DialogDescription>
          </DialogHeader>
          {editPost && (
            <PostForm
              post={editPost}
              onSuccess={() => {
                setEditPost(null);
                fetchPosts();
              }}
              onCancel={() => setEditPost(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>게시글 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.title}&quot;을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
