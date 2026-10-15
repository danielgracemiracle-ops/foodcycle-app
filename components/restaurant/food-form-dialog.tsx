'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Food, FoodCategory } from '@/types'
import { FOOD_CATEGORIES } from '@/types'
import { calculateQualityScore, ratingToScore } from '@/lib/quality'
import { createFood, updateFood, validateFoodInput, type FoodInput } from '@/services/food-service'
import { useAction } from '@/hooks/use-db'
import { FormField } from '@/components/shared/form-field'
import { QualityBreakdown } from '@/components/shared/quality-score'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { calculateHealthScore, getMainIngredients, MAIN_INGREDIENTS } from '@/lib/food-tags'
import { HealthBadge } from '@/components/shared/health-badge'

const PHOTOS = [
  'chicken-rice-bowl', 'nasi-goreng', 'rendang-rice', 'nasi-uduk', 'mie-ayam', 'beef-ramen', 'kwetiau', 'croissant-box', 'roti-pandan',
  'banana-bread', 'quinoa-salad', 'gado-gado', 'pisang-goreng', 'risoles', 'dimsum', 'es-kopi-susu', 'green-smoothie',
].map((n) => `/foods/${n}.png`)

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function blankInput(defaultPickupMinutes: number): FoodInput {
  const start = new Date(Date.now() + 30 * 60_000)
  const end = new Date(start.getTime() + defaultPickupMinutes * 60_000)
  return {
    name: '', category: 'Rice', description: '', image: PHOTOS[0], originalPrice: 0, price: 0, quantity: 5,
    pickupStart: start.toISOString(), pickupEnd: end.toISOString(), ingredients: [], mainIngredients: [], allergens: [],
    donationAvailable: true, freshness: 85, packaging: 80, weightKg: 0.4,
  }
}

function fromFood(f: Food): FoodInput {
  return {
    name: f.name, category: f.category, description: f.description, image: f.image, originalPrice: f.originalPrice, price: f.price,
    quantity: f.quantity, pickupStart: f.pickupStart, pickupEnd: f.pickupEnd, ingredients: f.ingredients, mainIngredients: getMainIngredients(f), allergens: f.allergens,
    donationAvailable: f.donationAvailable, freshness: f.quality.freshness, packaging: f.quality.packaging, weightKg: f.weightKg,
  }
}

const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

export function FoodFormDialog({
  open,
  onOpenChange,
  food,
  restaurantRating,
  defaultPickupMinutes,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  food?: Food
  restaurantRating: number
  defaultPickupMinutes: number
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        {open && (
          <FoodForm
            key={food?.id ?? 'new'}
            food={food}
            restaurantRating={restaurantRating}
            defaultPickupMinutes={defaultPickupMinutes}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function FoodForm({ food, restaurantRating, defaultPickupMinutes, onDone }: {
  food?: Food
  restaurantRating: number
  defaultPickupMinutes: number
  onDone: () => void
}) {
  const [input, setInput] = useState<FoodInput>(() => (food ? fromFood(food) : blankInput(defaultPickupMinutes)))
  const [ingredients, setIngredients] = useState(input.ingredients.join(', '))
  const [allergens, setAllergens] = useState(input.allergens.join(', '))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [save, saving] = useAction(
    async (payload: FoodInput) => {
      if (food) await updateFood(food.id, payload)
      else await createFood(payload)
    },
    { success: food ? 'Listing updated' : 'Listing published', onSuccess: onDone },
  )

  const set = <K extends keyof FoodInput>(key: K, value: FoodInput[K]) => setInput((p) => ({ ...p, [key]: value }))
  const preview = calculateQualityScore({
    freshness: input.freshness,
    packaging: input.packaging,
    restaurantRating: food?.quality.restaurantRating ?? ratingToScore(restaurantRating || 4),
    customerFeedback: food?.quality.customerFeedback ?? 80,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...input, ingredients: splitList(ingredients), allergens: splitList(allergens) }
    const found = validateFoodInput(payload)
    setErrors(found)
    if (Object.keys(found).length === 0) save(payload)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{food ? 'Edit listing' : 'New surplus listing'}</DialogTitle>
        <DialogDescription>Grade is calculated automatically from the pickup deadline and quality score.</DialogDescription>
      </DialogHeader>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Photo</legend>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PHOTOS.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => set('image', src)}
              aria-pressed={input.image === src}
              aria-label={`Use photo ${src.split('/').pop()?.replace('.png', '').replace(/-/g, ' ')}`}
              className={cn('shrink-0 overflow-hidden rounded-xl border-2 transition', input.image === src ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100')}
            >
              <Image src={src} alt="" width={64} height={64} className="size-16 object-cover" />
            </button>
          ))}
        </div>
        {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" error={errors.name}>
          {(p) => <Input {...p} value={input.name} onChange={(e) => set('name', e.target.value)} placeholder="Nasi Goreng Kampung" />}
        </FormField>
        <FormField label="Category">
          {(p) => (
            <Select value={input.category} onValueChange={(v) => v && set('category', v as FoodCategory)}>
              <SelectTrigger {...p} className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FOOD_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </div>

      <FormField label="Description" error={errors.description}>
        {(p) => <Textarea {...p} value={input.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="What's in the box, portion size, how it was stored..." />}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-4">
        <FormField label="Original price (Rp)" error={errors.originalPrice}>
          {(p) => <Input {...p} type="number" inputMode="numeric" min={0} value={input.originalPrice || ''} onChange={(e) => set('originalPrice', Number(e.target.value))} />}
        </FormField>
        <FormField label="Discount price (Rp)" error={errors.price}>
          {(p) => <Input {...p} type="number" inputMode="numeric" min={0} value={input.price || ''} onChange={(e) => set('price', Number(e.target.value))} />}
        </FormField>
        <FormField label="Quantity" error={errors.quantity}>
          {(p) => <Input {...p} type="number" inputMode="numeric" min={0} value={input.quantity} onChange={(e) => set('quantity', Math.floor(Number(e.target.value)))} />}
        </FormField>
        <FormField label="Weight / portion (kg)">
          {(p) => <Input {...p} type="number" inputMode="decimal" step="0.1" min={0} value={input.weightKg} onChange={(e) => set('weightKg', Number(e.target.value))} />}
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Pickup from" error={errors.pickupStart}>
          {(p) => <Input {...p} type="datetime-local" value={toLocalInput(input.pickupStart)} onChange={(e) => e.target.value && set('pickupStart', new Date(e.target.value).toISOString())} />}
        </FormField>
        <FormField label="Pickup deadline" error={errors.pickupEnd}>
          {(p) => <Input {...p} type="datetime-local" value={toLocalInput(input.pickupEnd)} onChange={(e) => e.target.value && set('pickupEnd', new Date(e.target.value).toISOString())} />}
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Ingredients" hint="Separate with commas" error={errors.ingredients}>
          {(p) => <Input {...p} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Rice, egg, chicken" />}
        </FormField>
        <FormField label="Allergens" hint="Separate with commas">
          {(p) => <Input {...p} value={allergens} onChange={(e) => setAllergens(e.target.value)} placeholder="Egg, soy" />}
        </FormField>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Main ingredients</legend>
        <p className="text-xs text-muted-foreground">Customers filter by these (e.g. nasi, ayam). Pick all that apply.</p>
        <div className="flex flex-wrap gap-2">
          {MAIN_INGREDIENTS.map((m) => {
            const active = input.mainIngredients.includes(m.value)
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  set('mainIngredients', active ? input.mainIngredients.filter((v) => v !== m.value) : [...input.mainIngredients, m.value])
                }
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/50',
                )}
              >
                {m.label}
              </button>
            )
          })}
        </div>
        {errors.mainIngredients && <p className="text-xs text-destructive">{errors.mainIngredients}</p>}
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Health label preview:</span>
          <HealthBadge
            health={calculateHealthScore({ ...input, ingredients: splitList(ingredients) })}
          />
        </div>
      </fieldset>

      <div className="grid gap-5 rounded-2xl bg-muted p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <QualitySlider label="Freshness" value={input.freshness} onChange={(v) => set('freshness', v)} />
          <QualitySlider label="Packaging" value={input.packaging} onChange={(v) => set('packaging', v)} />
        </div>
        <QualityBreakdown quality={preview} />
      </div>

      <label className="flex items-center justify-between gap-4 rounded-2xl border p-4">
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Available for donation</span>
          <span className="text-xs text-muted-foreground">Customers can buy this for a social institution.</span>
        </span>
        <Switch checked={input.donationAvailable} onCheckedChange={(v) => set('donationAvailable', v)} />
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : food ? 'Save changes' : 'Publish listing'}</Button>
      </DialogFooter>
    </form>
  )
}

function QualitySlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <Slider
        aria-label={label}
        min={0}
        max={100}
        step={5}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  )
}
