// Cloudinary upload helper
export const uploadToCloudinary = async (file, folder = 'academy', weekNumber = null) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary credentials not configured')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)
    
    // Folder structure: academy/week_{weekNumber}/resource_type/
    if (weekNumber) {
        formData.append('folder', `academy/week_${weekNumber}`)
    } else {
        formData.append('folder', folder)
    }

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error('Upload failed')
        }

        const data = await response.json()
        return {
            url: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
            format: data.format,
            resourceType: data.resource_type
        }
    } catch (error) {
        console.error('Cloudinary upload error:', error)
        throw error
    }
}

export const uploadVideoToCloudinary = async (file, weekNumber) => {
    return uploadToCloudinary(file, 'academy', weekNumber)
}

export const uploadImageToCloudinary = async (file, weekNumber) => {
    return uploadToCloudinary(file, 'academy', weekNumber)
}

