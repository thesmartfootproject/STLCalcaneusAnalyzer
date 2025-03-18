import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/hooks/use-toast';

interface FileDropzoneProps {
  label: string;
  accept: Record<string, string[]>;
  fileType: 'medial' | 'lateral' | 'screws';
  onChange: (file: File | null) => void;
  value: File | null;
  helpText?: string;
}

const FileDropzone = ({ label, accept, fileType, onChange, value, helpText }: FileDropzoneProps) => {
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file type
    if (fileType === 'screws' && !file.name.toLowerCase().endsWith('.zip')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a zip file containing STL files for screws"
      });
      return;
    } else if ((fileType === 'medial' || fileType === 'lateral') && !file.name.toLowerCase().endsWith('.stl')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload an STL file"
      });
      return;
    }

    onChange(file);
    setFilePreview(URL.createObjectURL(file));
  }, [fileType, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept
  });

  const removeFile = () => {
    onChange(null);
    
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const getIconClass = () => {
    switch (fileType) {
      case 'medial':
      case 'lateral':
        return 'fas fa-file-code';
      case 'screws':
        return 'fas fa-file-archive';
      default:
        return 'fas fa-file';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer ${
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        
        {!value ? (
          <>
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600 mt-2">
              <span className="font-medium text-primary-600 hover:text-primary-500">
                Upload a file
              </span>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{helpText || `${fileType === 'screws' ? 'ZIP file with STLs' : 'STL file only'}`}</p>
          </>
        ) : (
          <div className="w-full mt-0">
            <div className="flex items-center p-2 bg-primary-50 rounded">
              <i className={`${getIconClass()} text-primary-600 mr-2`}></i>
              <span className="text-sm text-gray-700 truncate flex-1">
                {value.name}
              </span>
              <button
                type="button"
                className="text-gray-500 hover:text-red-500 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            {fileType === 'screws' && (
              <div className="mt-2 text-xs text-gray-600">
                <span className="font-medium">ZIP file</span> containing STL files
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDropzone;
