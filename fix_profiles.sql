ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN LOWER(NEW.email) = 'vsfitgym@gmail.com' THEN 'personal'
      ELSE 'aluno'
    END,
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
