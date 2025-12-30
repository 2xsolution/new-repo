import CreateForm from '@/components/CreateForm';

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 to-yellow-950 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-yellow-100 mb-4">
              Launch Your Token 💩
            </h1>
            <p className="text-yellow-300 text-lg">
              Create a token with a bonding curve. 50 SOL cap, automatic LP migration.
            </p>
          </div>

          <CreateForm />
        </div>
      </div>
    </div>
  );
}