import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { eventsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChefHat,
  Plus,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import type { EventCreate, FoodItemCreate } from '../types'

interface EventFormData {
  title: string
  description: string
  event_date: string
  event_time: string
  location_name: string
  location_address: string
  location_notes: string
  max_guests: number
  reserved_spots: number
  min_guests: number
  rsvp_deadline_date: string
  rsvp_deadline_time: string
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [foodItems, setFoodItems] = useState<FoodItemCreate[]>([])
  const [newFoodItem, setNewFoodItem] = useState({ name: '', description: '', quantity_needed: 1 })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: {
      max_guests: 8,
      reserved_spots: 0,
      min_guests: 2,
    },
  })

  const createEventMutation = useMutation({
    mutationFn: (data: EventCreate) => eventsApi.create(data),
    onSuccess: (event) => {
      toast.success('Event created successfully!')
      navigate(`/events/${event.id}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create event')
    },
  })

  const addFoodItem = () => {
    if (!newFoodItem.name.trim()) return
    setFoodItems([...foodItems, { ...newFoodItem }])
    setNewFoodItem({ name: '', description: '', quantity_needed: 1 })
  }

  const removeFoodItem = (index: number) => {
    setFoodItems(foodItems.filter((_, i) => i !== index))
  }

  const onSubmit = (data: EventFormData) => {
    const eventDate = new Date(`${data.event_date}T${data.event_time}`)
    const rsvpDeadline = new Date(`${data.rsvp_deadline_date}T${data.rsvp_deadline_time}`)

    const eventData: EventCreate = {
      title: data.title,
      description: data.description || undefined,
      event_date: eventDate.toISOString(),
      location_name: data.location_name,
      location_address: data.location_address || undefined,
      location_notes: data.location_notes || undefined,
      max_guests: data.max_guests,
      reserved_spots: data.reserved_spots,
      min_guests: data.min_guests,
      rsvp_deadline: rsvpDeadline.toISOString(),
      is_public: true,
      food_items: foodItems,
    }

    createEventMutation.mutate(eventData)
  }

  // Check if user can host
  if (!user?.can_host) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cannot Host Events</h2>
        <p className="text-gray-600 mb-4">
          Your trust score ({user?.trust_score}) is below the minimum required to host events (50).
          Attend more events and build your reputation to unlock hosting!
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Host a Dinner Party</h1>
        <p className="text-gray-600 mt-1">Create an event and invite guests to join</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Event Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="input"
                placeholder="e.g., Italian Dinner Night"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                {...register('description')}
                className="input"
                rows={3}
                placeholder="Tell guests what to expect..."
              />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary-500" />
            Date & Time
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Event Date *</label>
              <input
                {...register('event_date', { required: 'Date is required' })}
                type="date"
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.event_date && (
                <p className="mt-1 text-sm text-red-500">{errors.event_date.message}</p>
              )}
            </div>

            <div>
              <label className="label">Event Time *</label>
              <input
                {...register('event_time', { required: 'Time is required' })}
                type="time"
                className="input"
              />
              {errors.event_time && (
                <p className="mt-1 text-sm text-red-500">{errors.event_time.message}</p>
              )}
            </div>

            <div>
              <label className="label">RSVP Deadline Date *</label>
              <input
                {...register('rsvp_deadline_date', { required: 'RSVP deadline is required' })}
                type="date"
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.rsvp_deadline_date && (
                <p className="mt-1 text-sm text-red-500">{errors.rsvp_deadline_date.message}</p>
              )}
            </div>

            <div>
              <label className="label">RSVP Deadline Time *</label>
              <input
                {...register('rsvp_deadline_time', { required: 'Time is required' })}
                type="time"
                className="input"
              />
              {errors.rsvp_deadline_time && (
                <p className="mt-1 text-sm text-red-500">{errors.rsvp_deadline_time.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary-500" />
            Location
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Location Name *</label>
              <input
                {...register('location_name', { required: 'Location name is required' })}
                className="input"
                placeholder="e.g., My Apartment, The Smith's House"
              />
              {errors.location_name && (
                <p className="mt-1 text-sm text-red-500">{errors.location_name.message}</p>
              )}
            </div>

            <div>
              <label className="label">Address</label>
              <input
                {...register('location_address')}
                className="input"
                placeholder="123 Main St, City, State"
              />
            </div>

            <div>
              <label className="label">Location Notes</label>
              <textarea
                {...register('location_notes')}
                className="input"
                rows={2}
                placeholder="e.g., Apartment 4B, buzz #123, parking in back"
              />
            </div>
          </div>
        </div>

        {/* Guest Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary-500" />
            Guest Settings
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Max Guests *</label>
              <input
                {...register('max_guests', {
                  required: 'Required',
                  min: { value: 1, message: 'At least 1' },
                  max: { value: 100, message: 'Max 100' },
                })}
                type="number"
                className="input"
                min={1}
                max={100}
              />
              {errors.max_guests && (
                <p className="mt-1 text-sm text-red-500">{errors.max_guests.message}</p>
              )}
            </div>

            <div>
              <label className="label">Reserved Spots</label>
              <input
                {...register('reserved_spots', { min: 0 })}
                type="number"
                className="input"
                min={0}
              />
              <p className="text-xs text-gray-500 mt-1">For specific invites</p>
            </div>

            <div>
              <label className="label">Min to Confirm *</label>
              <input
                {...register('min_guests', {
                  required: 'Required',
                  min: { value: 1, message: 'At least 1' },
                })}
                type="number"
                className="input"
                min={1}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum RSVPs needed</p>
            </div>
          </div>
        </div>

        {/* Food Items */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChefHat className="h-5 w-5 mr-2 text-primary-500" />
            Food Items (What guests can bring)
          </h2>

          {/* Existing food items */}
          {foodItems.length > 0 && (
            <div className="space-y-2 mb-4">
              {foodItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                    <p className="text-xs text-gray-400">Quantity needed: {item.quantity_needed}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFoodItem(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add food item form */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  value={newFoodItem.name}
                  onChange={(e) => setNewFoodItem({ ...newFoodItem, name: e.target.value })}
                  className="input"
                  placeholder="Item name (e.g., Salad)"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newFoodItem.description}
                  onChange={(e) => setNewFoodItem({ ...newFoodItem, description: e.target.value })}
                  className="input"
                  placeholder="Description (optional)"
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={newFoodItem.quantity_needed}
                  onChange={(e) => setNewFoodItem({ ...newFoodItem, quantity_needed: Number(e.target.value) })}
                  className="input w-20"
                  min={1}
                  placeholder="Qty"
                />
                <button
                  type="button"
                  onClick={addFoodItem}
                  disabled={!newFoodItem.name.trim()}
                  className="btn-secondary flex items-center"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createEventMutation.isPending}
            className="btn-primary"
          >
            {createEventMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
