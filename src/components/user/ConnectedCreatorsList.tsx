import type { Creator } from "./CreatorList";

interface ConnectedCreatorsListProps {
  connectedCreators: Creator[];
}

const ConnectedCreatorsList: React.FC<ConnectedCreatorsListProps> = ({ connectedCreators }) => {
  return (
    <div className="p-8 max-w-5xl min-h-[80vh] mx-auto flex flex-col items-center">
      <h2 className="text-3xl font-extrabold mb-8 text-orange-900 tracking-tight text-center">Connected Creators</h2>
      {connectedCreators.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-md px-8 py-16 mt-12 space-y-4 w-full max-w-xl">
          <svg className="w-16 h-16 text-orange-200 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
          <p className="text-gray-500 text-lg">No connected creators found</p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-8">
          {connectedCreators.map((creator) => (
            <div key={creator.id} className="flex flex-col items-center bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all border border-orange-100">
              <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden mb-4">
                {creator.profile_image ? (
                  <img
                    src={creator.profile_image}
                    alt={creator.name || "Creator"}
                    className="w-full h-full object-cover rounded-lg"
                    onError={e => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.name || "U")}`;
                    }}
                  />
                ) : (
                  <span className="text-3xl font-bold">{creator?.name?.charAt(0) || "?"}</span>
                )}
              </div>
              <div className="text-center w-full">
                <div className="flex flex-col items-center">
                  <span className="font-semibold text-lg text-gray-900">{creator?.name || "Unknown Creator"}</span>
                  <span className="text-sm text-gray-500 mb-2">@{creator?.twitter_username || "unknown"}</span>
                </div>
                <div className="text-gray-700 text-sm mt-2 min-h-[40px]">
                  {creator?.description || <span className="text-gray-300">No description</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConnectedCreatorsList;
