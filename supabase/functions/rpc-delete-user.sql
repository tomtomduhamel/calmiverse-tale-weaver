
-- Cette fonction permet à un utilisateur de supprimer son propre compte de manière sécurisée
create or replace function public.delete_user()
returns void 
language plpgsql 
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  -- Récupérer l'ID de l'utilisateur connecté
  current_user_id := auth.uid();
  
  -- Vérification que l'utilisateur est connecté
  if current_user_id is null then
    raise exception 'Vous devez être connecté pour effectuer cette action';
  end if;

  -- Supprimer les données des tables associées dans le bon ordre
  -- (pour respecter les contraintes de clés étrangères)
  delete from public.children where authorid = current_user_id;
  delete from public.stories where authorid = current_user_id;
  delete from public.users where id = current_user_id;
  
  -- Supprimer l'utilisateur de auth.users
  -- Note: Cette opération nécessite des privilèges élevés
  delete from auth.users where id = current_user_id;
  
  -- Log de l'opération pour audit
  raise notice 'Compte utilisateur % supprimé avec succès', current_user_id;
end;
$$;

-- Accorder les permissions nécessaires
grant execute on function public.delete_user() to authenticated;
