
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Sandbox = () => {
  const { '*': filePath } = useParams();
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchFile = async () => {
      if (!filePath) {
        setError('No file path specified');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.storage
          .from('sandbox')
          .download(filePath);

        if (error) {
          throw error;
        }

        if (data) {
          const text = await data.text();
          setFileContent(text);
        }
      } catch (err) {
        console.error('Error fetching file:', err);
        setError(`File not found: ${filePath}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [filePath]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  // Return plain text content for files
  return (
    <pre className="whitespace-pre-wrap font-mono text-sm">
      {fileContent}
    </pre>
  );
};

export default Sandbox;
