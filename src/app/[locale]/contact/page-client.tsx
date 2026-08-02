'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Phone, Mail, Clock, Linkedin, Youtube, Twitter, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useSiteConfig } from '@/providers/site-config-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
  const t = useTranslations('contact');
  const { config, loading } = useSiteConfig();

  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/v1/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          company: form.company || undefined,
          message: form.message,
          quantity: 1,
        }),
      });

      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', company: '', message: '' });
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: MapPin, label: t('address'), value: config.contact_address || 'No. 88, Industrial Avenue, Guangzhou, China' },
    { icon: Phone, label: t('phone'), value: config.contact_phone || '+86 20-8888-8888' },
    { icon: Mail, label: t('email'), value: config.contact_email || 'info@ridecraft.com' },
    { icon: Clock, label: t('working_hours'), value: t('working_hours_value') },
  ];

  const socialLinks = [
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Twitter, href: '#', label: 'Twitter' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            {t('title')}
          </h1>
          <p
            className="text-xl text-blue-200 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150"
          >
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left - Contact Info */}
            <div
            className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700"
          >
              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="text-gray-900 font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="pt-6 border-t">
                <p className="text-sm text-gray-500 mb-3">{t('follow_us')}</p>
                <div className="flex gap-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-colors"
                      aria-label={link.label}
                    >
                      <link.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <div
              className="lg:col-span-3 animate-in fade-in slide-in-from-right-4 duration-700 delay-150"
            >
              <div className="bg-white rounded-xl border p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  {t('form_title')}
                </h2>

                {status === 'success' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-green-800 font-medium">{t('form_success')}</p>
                    <Button variant="outline" className="mt-4" onClick={() => setStatus('idle')}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('form_name')} *</Label>
                        <Input
                          id="name"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="John Smith"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('form_email')} *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('form_phone')}</Label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+86 138-0000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">{t('form_company')}</Label>
                        <Input
                          id="company"
                          value={form.company}
                          onChange={(e) => setForm({ ...form, company: e.target.value })}
                          placeholder="Your Company Ltd."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t('form_message')} *</Label>
                      <Textarea
                        id="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Tell us about your project, requirements, or any questions..."
                      />
                    </div>

                    {status === 'error' && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {t('form_error')}
                      </div>
                    )}

                    <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          {t('form_submit')}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2
            className="text-3xl font-bold text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            {t('map_title')}
          </h2>
          <div className="rounded-xl overflow-hidden shadow-lg aspect-[21/9] bg-gray-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d230594.908153005!2d113.264357!3d23.129062!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3402f1f8b0b0b0b1%3A0x0!2z5bm_5bee5biC!5e0!3m2!1szh-CN!2scn!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '300px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Factory Location"
            />
          </div>
        </div>
      </section>
    </div>
  );
}