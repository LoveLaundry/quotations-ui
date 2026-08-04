import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'

export default function NotFoundPage() {
  return (
    <Card className="mx-auto mt-20 max-w-lg text-center">
      <CardContent>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-slate-600">The page you are looking for does not exist.</p>
        <Link to="/">
          <Button className="mt-6">Take me home</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
