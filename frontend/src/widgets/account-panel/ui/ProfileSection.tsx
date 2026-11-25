import { useAuth } from '@/entities/user';

const READ_ONLY_INPUT = 'w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 font-medium text-stone-900';

export function ProfileSection() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-black text-stone-900">Personal &amp; Store Details</h3>
        <p className="text-xs text-stone-500">Your profile information for deliveries and billing</p>
      </div>

      <div className="grid max-w-lg grid-cols-1 gap-4 text-xs sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="mb-1 block font-semibold text-stone-500">Full Name</label>
          <input id="profile-name" type="text" value={user.name} readOnly className={READ_ONLY_INPUT} />
        </div>
        <div>
          <label htmlFor="profile-phone" className="mb-1 block font-semibold text-stone-500">Mobile Number</label>
          <input id="profile-phone" type="text" value={user.phone} readOnly className={READ_ONLY_INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="profile-email" className="mb-1 block font-semibold text-stone-500">Email ID</label>
          <input id="profile-email" type="text" value={user.email} readOnly className={READ_ONLY_INPUT} />
        </div>
      </div>
    </div>
  );
}
