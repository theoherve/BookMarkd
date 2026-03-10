import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBookDetail } from "@/features/admin/server/get-book-detail";
import { StatCard } from "@/components/admin/shared/stat-card";
import { BookRatingsChart } from "@/components/admin/books/book-ratings-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Users, MessageSquare, Eye, Star } from "lucide-react";

type Props = {
  params: Promise<{ bookId: string }>;
};

const AdminBookDetailPage = async ({ params }: Props) => {
  const { bookId } = await params;
  const book = await getBookDetail(bookId);

  if (!book) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/books"><Button variant="ghost" size="icon-sm"><ArrowLeft className="size-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{book.title}</h1>
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </div>
        {book.coverUrl && <Image src={book.coverUrl} alt="" width={48} height={72} className="rounded-md object-cover" />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Lecteurs" value={book.readersCount} icon={Users} />
        <StatCard title="Avis" value={book.reviewsCount} icon={MessageSquare} />
        <StatCard title="Note moyenne" value={book.averageRating > 0 ? book.averageRating.toFixed(1) : "—"} icon={Star} />
        <StatCard title="Notes" value={book.ratingsCount} icon={BookOpen} />
        <StatCard title="Vues" value={book.viewsCount} icon={Eye} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BookRatingsChart distribution={book.ratingDistribution} />
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {book.isbn && <div className="flex justify-between"><span className="text-muted-foreground">ISBN</span><span>{book.isbn}</span></div>}
            {book.publisher && <div className="flex justify-between"><span className="text-muted-foreground">Éditeur</span><span>{book.publisher}</span></div>}
            {book.language && <div className="flex justify-between"><span className="text-muted-foreground">Langue</span><span>{book.language}</span></div>}
            {book.publicationYear && <div className="flex justify-between"><span className="text-muted-foreground">Année</span><span>{book.publicationYear}</span></div>}
            {book.googleBooksId && <div className="flex justify-between"><span className="text-muted-foreground">Google Books</span><span className="truncate max-w-[200px]">{book.googleBooksId}</span></div>}
            {book.openLibraryId && <div className="flex justify-between"><span className="text-muted-foreground">OpenLibrary</span><span>{book.openLibraryId}</span></div>}
          </CardContent>
        </Card>
      </div>

      {book.tags.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Tags</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">{book.tags.map((tag) => <Badge key={tag.id} variant="secondary">{tag.name}</Badge>)}</div>
          </CardContent>
        </Card>
      )}

      {book.summary && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Résumé</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{book.summary}</p></CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminBookDetailPage;
