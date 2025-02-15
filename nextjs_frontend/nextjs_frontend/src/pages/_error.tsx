import { NextPage } from 'next'

interface Props {
  statusCode?: number
}

const Error: NextPage<Props> = ({ statusCode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {statusCode ? `Une erreur ${statusCode} s'est produite` : 'Une erreur s\'est produite'}
        </h1>
        <p className="text-gray-600">
          Désolé, quelque chose s'est mal passé. Veuillez réessayer plus tard.
        </p>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
