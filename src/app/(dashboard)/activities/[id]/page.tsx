import Image from "next/image";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import Link from "next/link";
import PDFViewer from "@/components/PDFViewer";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/auth";
import { serializeActivity } from "@/lib/serialize";
import {
  canAccessActivity,
  canSeeTeacherContent,
  findActivityByIdOrLegacyId,
} from "@/lib/queries";

type ActivityPageProps = { params: Promise<{ id: string }> };

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/");

  const found = await findActivityByIdOrLegacyId(id);
  if (!found) notFound();

  // Old links used the integer id from the hardcoded data; send them to the
  // canonical URL so only one shape stays in circulation.
  if (found.matchedLegacyId) {
    permanentRedirect(`/activities/${String(found.doc._id)}`);
  }

  const activity = serializeActivity(found.doc.toObject(), {
    includeTeacherContent: canSeeTeacherContent(session),
  });

  if (!canAccessActivity(session, activity)) notFound();

  // Prefer returning to the class the viewer actually belongs to.
  const ownClassIds = new Set(session.classes.map((entry) => entry.id));
  const backClass =
    activity.classes.find((entry) => ownClassIds.has(entry.id)) ?? activity.classes[0];
  const backHref = backClass ? `/class/${backClass.id}` : "/";

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1">
        {/* Side decorations, stretched to span from the navbar down to the footer.
            Hidden below the lg breakpoint where there's no room for them. */}
        <div className="relative hidden w-[8vw] max-w-[159px] flex-none lg:block">
          <Image src="/activity-left.svg" alt="" fill className="object-cover" />
        </div>

        <div className="container mx-auto p-6 relative flex-1">
          {/* Button to navigate back to class activity grid */}
          <Link href={backHref} passHref>
            <button className="absolute top-4 left-4 p-2 rounded-lg bg-white shadow-md hover:bg-zinc-100 text-zinc-500">
              Voltar
            </button>
          </Link>

          <h1 className="text-xl font-semibold mb-4 text-center">{activity.name}</h1>

          <PDFViewer
            activityBookLink={activity.activityBook}
            guideLink={activity.guide}
            extraLink={activity.extra}
            teacherGuideLink={activity.teacherGuide}
          />
        </div>

        <div className="relative hidden w-[8vw] max-w-[159px] flex-none lg:block">
          <Image src="/activity-right.svg" alt="" fill className="object-cover" />
        </div>
      </div>

      <Footer />
    </div>
  );
}
