import { useEffect } from 'react'

interface PageTitleProps {
  title: string
  suffix?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogUrl?: string
  ogImage?: string
}

export default function PageTitle({
  title,
  suffix = 'Waybill Tracking',
  description,
  ogTitle,
  ogDescription,
  ogUrl,
  ogImage,
}: PageTitleProps) {
  useEffect(() => {
    const originalTitle = document.title
    document.title = `${title} — ${suffix}`
    return () => {
      document.title = originalTitle
    }
  }, [title, suffix])

  useEffect(() => {
    const metaTags: { name?: string; property?: string; content: string }[] = []
    if (description) {
      metaTags.push({ name: 'description', content: description })
    }
    if (ogTitle) {
      metaTags.push({ property: 'og:title', content: ogTitle })
    }
    if (ogDescription) {
      metaTags.push({ property: 'og:description', content: ogDescription })
    }
    if (ogUrl) {
      metaTags.push({ property: 'og:url', content: ogUrl })
    }
    if (ogImage) {
      metaTags.push({ property: 'og:image', content: ogImage })
    }
    metaTags.push({ property: 'og:type', content: 'website' })

    const created: HTMLMetaElement[] = []
    metaTags.forEach((tag) => {
      const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[property="${tag.property}"]`
      let el = document.querySelector(selector) as HTMLMetaElement | null
      let wasCreated = false
      if (!el) {
        el = document.createElement('meta')
        wasCreated = true
      }
      if (tag.name) el.setAttribute('name', tag.name)
      if (tag.property) el.setAttribute('property', tag.property)
      el.setAttribute('content', tag.content)
      if (wasCreated) {
        document.head.appendChild(el)
        created.push(el)
      }
    })

    return () => {
      created.forEach((el) => document.head.removeChild(el))
    }
  }, [description, ogTitle, ogDescription, ogUrl, ogImage])

  return null
}
