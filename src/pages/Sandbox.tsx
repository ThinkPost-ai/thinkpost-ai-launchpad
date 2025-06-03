
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Sandbox = () => {
  const { '*': filePath } = useParams();
  const [fileContent, setFileContent] = useState<string>('');
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!filePath) {
      // Show file listing when no specific file is requested
      fetchFileList();
    } else {
      // Show specific file content
      fetchFile();
    }
  }, [filePath]);

  const fetchFileList = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('sandbox')
        .list('', {
          limit: 100,
          offset: 0,
        });

      if (error) {
        throw error;
      }

      setFileList(data || []);
    } catch (err) {
      console.error('Error fetching file list:', err);
      setError('Error loading file list');
    } finally {
      setLoading(false);
    }
  };

  const fetchFile = async () => {
    if (!filePath) return;

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

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  // Show file listing when no specific file is requested
  if (!filePath) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Sandbox Files</h1>
        {fileList.length === 0 ? (
          <p className="text-gray-500">No files found in the sandbox bucket.</p>
        ) : (
          <div className="grid gap-3">
            {fileList.map((file) => (
              <div key={file.name} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <Link 
                  to={`/sandbox/${file.name}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {file.name}
                </Link>
                <div className="text-sm text-gray-500 mt-1">
                  Size: {file.metadata?.size ? `${(file.metadata.size / 1024).toFixed(2)} KB` : 'Unknown'}
                  {file.updated_at && (
                    <span className="ml-4">
                      Updated: {new Date(file.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show file content for specific files
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link to="/sandbox" className="text-blue-600 hover:text-blue-800">
          ← Back to file list
        </Link>
      </div>
      <h1 className="text-xl font-bold mb-4">{filePath}</h1>
      <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg border overflow-auto">
        {fileContent}
      </pre>
    </div>
  );
};

export default Sandbox;
