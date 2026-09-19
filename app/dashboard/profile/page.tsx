'use client'
import React, { useState, useEffect } from 'react'
import PictureDisplay from '@/components/PictureDisplay'
import { AuthStore } from '@/src/zustand/user/AuthStore'
import { MessageStore } from '@/src/zustand/notification/Message'
import apiRequest from '@/lib/axios'

interface UserResponse {
  message: string
  data: any
}

const Profile: React.FC = () => {
  const { user } = AuthStore()
  const { setMessage } = MessageStore()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
      setPhone(user.phone || '')
      if (user.picture) {
        setPreview(String(user.picture))
      }
    }
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setMessage('Full name cannot be blank', false)
      return
    }

    if (!user) {
      setMessage('User session expired. Please log in again.', false)
      return
    }

    const usernameParam = user.username || user.email || user.phone
    if (!usernameParam) {
      setMessage('Unable to identify user profile.', false)
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append('fullName', fullName.trim())
      if (phone.trim()) {
        form.append('phone', phone.trim())
      }
      if (selectedFile) {
        form.append('picture', selectedFile)
      }

      const response = await apiRequest<UserResponse>(`/users/${usernameParam}`, {
        method: 'PATCH',
        body: form,
        setMessage,
      })

      if (response?.data?.data) {
        AuthStore.getState().setUser(response.data.data)
        setMessage('Profile updated successfully!', true)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="card_body sharp h-full mb-10">
        <div className="custom_sm_title">My Profile</div>

        <form onSubmit={handleSave}>
          <div className="grid-2 grid-lay">
            {/* Profile Picture with Camera Icon */}
            <div className="flex flex-col items-center sm:items-start relative">
              <label className="label mb-2">Profile Picture</label>
              <div className="relative my-2 w-[160px] h-[160px]">
                <div className="w-[160px] h-[160px] rounded-2xl overflow-hidden border-2 border-[var(--border)] shadow-sm bg-[var(--white-gray)]">
                  {preview ? (
                    <PictureDisplay source={preview} />
                  ) : (
                    <PictureDisplay source={'/images/avatar.jpg'} />
                  )}
                </div>

                {/* Camera upload badge */}
                <label
                  htmlFor="profile-picture-upload"
                  className="w-10 h-10 flex justify-center items-center cursor-pointer bg-[var(--customColor)] hover:opacity-90 text-white rounded-full absolute -bottom-2 -right-2 shadow-lg transition-transform hover:scale-110 active:scale-95"
                  title="Change Profile Picture"
                >
                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <i className="bi bi-camera-fill text-lg"></i>
                </label>
              </div>
              <span className="text-xs text-[var(--secondaryTextColor)] mt-2">
                Click the camera icon to upload a new photo
              </span>
            </div>

            {/* Profile Form Details */}
            <div className="flex flex-col">
              <div className="mb-4">
                <label className="label" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="text"
                  disabled
                  value={user?.email || 'N/A'}
                  className="form-input opacity-70 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                />
              </div>

              <div className="mb-4">
                <label className="label" htmlFor="fullName">
                  Full Name <span className="text-[var(--customRedColor)]">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="mb-4">
                <label className="label" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          <div className="table-action flex flex-wrap pt-4 border-t border-[var(--border)] mt-6">
            <button
              type="submit"
              disabled={loading}
              className="custom_btn bg-[var(--customColor)] text-white flex items-center gap-2"
            >
              {loading ? (
                <>
                  <i className="bi bi-opencollective loading"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle text-lg"></i>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default Profile
