-- Update new-user trigger to handle Google metadata keys and backfill existing users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Backfill missing profile fields from auth.users metadata
update public.users u
set
  full_name = coalesce(u.full_name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name'),
  avatar_url = coalesce(u.avatar_url, au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture')
from auth.users au
where u.id = au.id
  and (u.full_name is null or u.avatar_url is null);

