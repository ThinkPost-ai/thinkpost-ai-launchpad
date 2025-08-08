import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Building2, Copy, MessageCircle, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WhatsAppFloat from '@/components/WhatsAppFloat';

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<'credit' | 'bank' | null>(null);
  const [copied, setCopied] = useState(false);

  const planId = searchParams.get('plan');
  
  const plans = {
    essentials: {
      name: 'الأساسيات',
      price: '149',
      currency: 'ريال',
      period: 'شهرياً',
      features: [
        '14 منشور كامل بالذكاء الاصطناعي',
        'تحسين الصور احترافياً',
        'تسميات توضيحية جذابة بالعربية',
        'جدولة ونشر تلقائي'
      ]
    },
    growth: {
      name: 'النمو',
      price: '280',
      currency: 'ريال',
      period: 'شهرياً',
      features: [
        'جميع ميزات خطة الأساسيات',
        '30 منشور مُنتج بالكامل شهرياً',
        'دعم ذو أولوية',
        'مثالي للنشر اليومي'
      ]
    }
  };

  const selectedPlan = planId && plans[planId as keyof typeof plans];

  useEffect(() => {
    if (!selectedPlan) {
      navigate('/');
    }
  }, [selectedPlan, navigate]);

  const handleCopyIban = () => {
    navigator.clipboard.writeText('SA9280000611608016294382');
    setCopied(true);
    toast({
      title: "تم النسخ",
      description: "تم نسخ رقم الآيبان بنجاح",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const phoneNumber = '966550281271';
    const message = `مرحبا، لقد قمت بالتحويل البنكي لخطة ${selectedPlan?.name} بمبلغ ${selectedPlan?.price} ${selectedPlan?.currency}. سأرسل لكم إيصال التحويل.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!selectedPlan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            إتمام عملية الدفع
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            اختر طريقة الدفع المناسبة لإتمام اشتراكك
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-center">ملخص الخطة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedPlan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mt-2">
                    <span className="text-3xl font-bold text-blue-600">
                      {selectedPlan.price}
                    </span>
                    <span className="text-gray-600 mr-1">{selectedPlan.currency}</span>
                    <span className="text-gray-600 mr-2">/ {selectedPlan.period}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-start text-right">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5 ml-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              اختر طريقة الدفع
            </h2>

            {/* Credit Card Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedMethod === 'credit' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedMethod('credit')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-right">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        بطاقة ائتمان
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        فيزا، ماستركارد، أو بطاقات أخرى
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                    قريباً
                  </Badge>
                </div>
                
                {selectedMethod === 'credit' && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      خدمة الدفع بالبطاقة الائتمانية ستكون متاحة قريباً
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Transfer Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedMethod === 'bank' ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => setSelectedMethod('bank')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                      <Building2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-right">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        تحويل بنكي
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        تحويل مباشر إلى الحساب البنكي
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">
                    متاح الآن
                  </Badge>
                </div>
                
                {selectedMethod === 'bank' && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-right">
                        معلومات الحساب البنكي:
                      </h4>
                      
                      <div className="space-y-3 text-right">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">اسم البنك:</span>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            بنك الراجحي (Alrajhi Bank)
                          </p>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">رقم الآيبان:</span>
                          <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyIban}
                              className="flex items-center gap-2"
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                              {copied ? 'تم النسخ' : 'نسخ'}
                            </Button>
                            <span className="font-mono text-lg font-semibold text-gray-900 dark:text-white">
                              SA9280000611608016294382
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">مبلغ التحويل:</span>
                          <p className="font-semibold text-2xl text-green-600">
                            {selectedPlan.price} {selectedPlan.currency}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-right">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                        خطوات إتمام الدفع:
                      </h5>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li>قم بالتحويل إلى الحساب المذكور أعلاه</li>
                        <li>احتفظ بإيصال التحويل (سكرين شوت)</li>
                        <li>أرسل الإيصال عبر الواتساب</li>
                        <li>سيتم تفعيل حسابك خلال 24 ساعة</li>
                      </ol>
                    </div>

                    <Button
                      onClick={handleWhatsApp}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 text-lg"
                    >
                      <MessageCircle className="ml-2 h-5 w-5" />
                      إرسال الإيصال عبر الواتساب
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <WhatsAppFloat />
    </div>
  );
};

export default Payment;
