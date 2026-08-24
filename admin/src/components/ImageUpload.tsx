import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

interface Props {
  currentImage?: string;
  onChange?: (file: File | null) => void;
}

export function ImageUpload({ currentImage, onChange }: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setPreview(null);
  }, [currentImage]);

  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    onChange?.(file);
    return false;
  };

  const imageUrl = preview || (currentImage ? `/uploads/${currentImage}` : null);

  return (
    <div>
      {imageUrl && (
        <div style={{ marginBottom: 10 }}>
          <img
            src={imageUrl}
            alt="preview"
            style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 6 }}
          />
        </div>
      )}
      <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
        <Button icon={<UploadOutlined />} size="large" block>
          {imageUrl ? 'Заменить фото' : 'Загрузить фото'}
        </Button>
      </Upload>
    </div>
  );
}
