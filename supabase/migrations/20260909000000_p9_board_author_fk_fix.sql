-- posts.author_id가 auth.users(id)를 참조하고 있어 PostgREST가
-- posts <-> profiles 관계를 찾지 못해(getPosts의 profiles(name) 조인 실패)
-- 게시판 글 작성 후 목록이 항상 비어보이는 버그가 있었습니다.
-- 다른 테이블(recorded_by)과 동일하게 profiles(id)를 참조하도록 수정합니다.

ALTER TABLE public.posts
  DROP CONSTRAINT posts_author_id_fkey,
  ADD CONSTRAINT posts_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
