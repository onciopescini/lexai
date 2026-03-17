import psycopg2

DATABASE_URL = 'postgresql://postgres:atena4apTutti!@18.196.166.196:5432/postgres'

try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()

    # Drop in case it exists
    cursor.execute("""
        DROP POLICY IF EXISTS "Public Access atena-documents" ON storage.objects;
    """)
    
    # Create the INSERT policy for everyone (or specifically for the anon role)
    cursor.execute("""
        CREATE POLICY "Public Access atena-documents" 
        ON storage.objects 
        FOR ALL 
        USING (bucket_id = 'atena-documents')
        WITH CHECK (bucket_id = 'atena-documents');
    """)
    
    print("RLS policy for atena-documents bucket created successfully.")
    
    cursor.close()
    conn.close()

except Exception as e:
    print('DB Error:', e)
