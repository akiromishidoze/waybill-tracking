import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function UnauthorizedPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ShieldAlert className="h-16 w-16 text-red-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t('auth.unauthorized')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth.unauthorized')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 flex justify-center">
          <Link
            to="/dashboard"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('auth.goBack')}
          </Link>
        </div>
      </div>
    </div>
  )
}
