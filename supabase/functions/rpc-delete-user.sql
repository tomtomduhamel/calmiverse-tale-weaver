
-- Cette fonction permet à un utilisateur de supprimer son propre compte
create or replace function public.delete_user()
returns void as $$
begin
  -- Vérification que l'utilisateur est connecté
  if auth.uid() is null then
    raise exception 'Vous devez être connecté pour effectuer cette action';
  end if;

  -- Supprimer les données des tables associées
  delete from public.children where authorid = auth.uid();
  delete from public.stories where authorid = auth.uid();
  delete from public.users where id = auth.uid();
  
  -- Supprimer l'utilisateur de auth.users (nécessite que l'extension auth soit disponible)
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;
