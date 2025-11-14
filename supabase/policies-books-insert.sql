-- Policy pour permettre aux utilisateurs authentifiés de créer des livres
-- À exécuter dans l'éditeur SQL Supabase si nécessaire

-- Si vous utilisez le service role key (ce qui est le cas dans ce projet),
-- cette policy n'est pas nécessaire car RLS est contourné.
-- Cependant, si vous voulez permettre aux utilisateurs de créer des livres
-- via le client Supabase (anon key), vous pouvez ajouter cette policy :

drop policy if exists "books_authenticated_insert" on public.books;
create policy "books_authenticated_insert" on public.books
  for insert
  with check (auth.uid() = created_by);

-- Note : Cette policy nécessite que auth.uid() corresponde à created_by.
-- Dans ce projet, nous utilisons le service role key qui contourne RLS,
-- donc cette policy n'est pas strictement nécessaire.

