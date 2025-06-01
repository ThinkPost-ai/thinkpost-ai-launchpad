
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, ArrowLeft, Plus, ImageIcon } from 'lucide-react';

interface Product {
  id?: string;
  name: string;
  price: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
}

const ProductCreation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([
    {
      name: '',
      price: '',
      description: '',
      image: null,
      imagePreview: null
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);

  const addProduct = () => {
    setProducts([...products, {
      name: '',
      price: '',
      description: '',
      image: null,
      imagePreview: null
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setProducts(updatedProducts);
  };

  const handleImageSelect = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      updateProduct(index, 'image', file);
      updateProduct(index, 'imagePreview', imageUrl);
    }
  }, []);

  const validateProducts = () => {
    return products.every(product => 
      product.name.trim() && 
      product.price.trim() && 
      product.description.trim() && 
      product.image
    );
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    return uploadData.path;
  };

  const saveProducts = async (generateCaptions = false) => {
    if (!user || !validateProducts()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields and add images for all products",
        variant: "destructive"
      });
      return;
    }

    if (generateCaptions) {
      setGeneratingCaptions(true);
    } else {
      setSaving(true);
    }

    try {
      const productPromises = products.map(async (product) => {
        // Upload image
        const imagePath = await uploadImage(product.image!);

        // Prepare product data
        const productData = {
          user_id: user.id,
          name: product.name,
          price: parseFloat(product.price),
          description: product.description,
          image_path: imagePath,
          caption: null
        };

        // Insert product into database
        const { data: insertedProduct, error: dbError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (dbError) throw dbError;

        return insertedProduct;
      });

      const savedProducts = await Promise.all(productPromises);

      if (generateCaptions) {
        // Generate captions using AI
        const captionPromises = savedProducts.map(async (product) => {
          try {
            const response = await fetch('/api/generate-caption', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                productName: product.name,
                price: product.price,
                description: product.description
              })
            });

            if (!response.ok) {
              throw new Error('Failed to generate caption');
            }

            const { caption } = await response.json();

            // Update product with generated caption
            const { error: updateError } = await supabase
              .from('products')
              .update({ caption })
              .eq('id', product.id);

            if (updateError) throw updateError;

            return { ...product, caption };
          } catch (error) {
            console.error('Failed to generate caption for product:', product.name, error);
            return product;
          }
        });

        await Promise.all(captionPromises);

        toast({
          title: "Success!",
          description: `${products.length} product(s) saved and captions generated successfully`
        });
      } else {
        toast({
          title: "Success!",
          description: `${products.length} product(s) saved successfully`
        });
      }

      navigate('/user-dashboard');
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save products",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      setGeneratingCaptions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/user-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-deep-blue dark:text-white mb-2">
            Add Products
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Add your delicious dishes with details and images to generate AI-powered captions
          </p>
        </div>

        <div className="space-y-6">
          {products.map((product, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Product {index + 1}</CardTitle>
                  {products.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`name-${index}`}>Product Name</Label>
                    <Input
                      id={`name-${index}`}
                      value={product.name}
                      onChange={(e) => updateProduct(index, 'name', e.target.value)}
                      placeholder="e.g., Margherita Pizza"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`price-${index}`}>Price ($)</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => updateProduct(index, 'price', e.target.value)}
                      placeholder="e.g., 12.99"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Textarea
                    id={`description-${index}`}
                    value={product.description}
                    onChange={(e) => updateProduct(index, 'description', e.target.value)}
                    placeholder="Describe your product..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor={`image-${index}`}>Product Image</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    {product.imagePreview ? (
                      <div className="relative">
                        <img
                          src={product.imagePreview}
                          alt="Product preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => {
                            updateProduct(index, 'image', null);
                            updateProduct(index, 'imagePreview', null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <Label htmlFor={`image-${index}`} className="cursor-pointer">
                          <span className="text-lg font-medium text-deep-blue dark:text-white">
                            Click to upload image
                          </span>
                        </Label>
                        <Input
                          id={`image-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageSelect(index, e)}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              onClick={addProduct}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Product
            </Button>

            <div className="flex gap-4">
              <Button
                onClick={() => saveProducts(false)}
                disabled={saving || generatingCaptions || !validateProducts()}
                variant="outline"
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
              <Button
                onClick={() => saveProducts(true)}
                disabled={saving || generatingCaptions || !validateProducts()}
                className="bg-gradient-primary hover:opacity-90 flex-1"
              >
                {generatingCaptions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving & Generating...
                  </>
                ) : (
                  'Save and Generate Content by AI'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCreation;
