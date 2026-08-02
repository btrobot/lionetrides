import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMiddleware, withAdmin } from '@/middleware/api';
import { settingsService } from '@/services/settings-service';
import { cacheResponse, errorResponse } from '@/lib/errors';

const updateSettingSchema = z.object({ key: z.string().min(1), value: z.string().min(1) });
const updateStatsSchema = z.object({ id: z.number(), label: z.string().optional(), value: z.string().optional(), suffix: z.string().optional(), icon: z.string().optional() });

async function getHandler() { try { const data = await settingsService.getSettings(); return NextResponse.json({ success: true, data }, { headers: cacheResponse(3600) }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
async function updateSettingHandler(request: NextRequest) { try { const body = await request.json(); const parsed = updateSettingSchema.parse(body); const item = await settingsService.updateSetting(parsed.key, parsed.value); return NextResponse.json({ success: true, data: item }); } catch (e) { if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.issues }, { status: 400 }); const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
async function updateStatsHandler(request: NextRequest) { try { const body = await request.json(); const parsed = updateStatsSchema.parse(body); const item = await settingsService.updateStats(parsed.id, parsed); return NextResponse.json({ success: true, data: item }); } catch (e) { if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.issues }, { status: 400 }); const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }

export const GET = withMiddleware(getHandler);
export const PUT = withMiddleware(withAdmin(updateSettingHandler));
export const PATCH = withMiddleware(withAdmin(updateStatsHandler));
