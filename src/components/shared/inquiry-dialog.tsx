'use client';

import { useState, createContext, useContext, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface InquiryFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  quantity: number;
  message: string;
}

interface InquiryContextType {
  openInquiry: (productId?: number, productName?: string) => void;
}

const InquiryContext = createContext<InquiryContextType>({
  openInquiry: () => {},
});

export function useInquiry() {
  return useContext(InquiryContext);
}

export function InquiryProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<number | undefined>();
  const [productName, setProductName] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedInquiryNo, setSubmittedInquiryNo] = useState<string | null>(null);
  const [formData, setFormData] = useState<InquiryFormData>({
    name: '', email: '', phone: '', company: '', quantity: 1, message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InquiryFormData, string>>>({});

  const openInquiry = useCallback((pid?: number, pname?: string) => {
    setProductId(pid);
    setProductName(pname);
    setSubmitted(false);
    setSubmittedInquiryNo(null);
    setFormData({ name: '', email: '', phone: '', company: '', quantity: 1, message: '' });
    setErrors({});
    setOpen(true);
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InquiryFormData, string>> = {};
    if (!formData.name || formData.name.length < 2) newErrors.name = 'Name is required';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.message || formData.message.length < 10) newErrors.message = 'Please provide more details';
    if (!formData.quantity || formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof InquiryFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, productId }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmittedInquiryNo(data.data?.inquiry_no || null);
      }
      setSubmitted(true);
    } catch {
      // error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const t = useTranslations('inquiry');

  return (
    <InquiryContext.Provider value={{ openInquiry }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          {submitted ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <DialogTitle className="text-xl mb-2">{t('success')}</DialogTitle>
              {submittedInquiryNo && (
                <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-blue-50 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-mono text-blue-700 font-medium">{submittedInquiryNo}</span>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-3">{t('success_message')}</p>
              <Button onClick={() => setOpen(false)} variant="outline" className="mt-4">{t('close')}</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{t('form_title')}{productName ? ` - ${productName}` : ''}</DialogTitle>
                <DialogDescription>{t('title')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('name')}</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="John Doe" />
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="john@company.com" />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input id="phone" value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+86-20-8888-8888" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">{t('company')}</Label>
                    <Input id="company" value={formData.company || ''} onChange={(e) => handleChange('company', e.target.value)} placeholder="Theme Park Inc." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">{t('quantity')}</Label>
                  <Input id="quantity" type="number" min={1} value={formData.quantity} onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)} />
                  {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('message')}</Label>
                  <Textarea id="message" rows={4} value={formData.message} onChange={(e) => handleChange('message', e.target.value)} placeholder="Tell us about your requirements..." />
                  {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : t('submit')}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </InquiryContext.Provider>
  );
}

export default InquiryProvider;