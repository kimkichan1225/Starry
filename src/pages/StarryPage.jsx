import NavBar from '../components/NavBar';

function StarryPage() {
  return (
    <div className="relative min-h-screen bg-[#FAF5FF]">
      <div className="flex flex-col min-h-screen pb-20">
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-[#6155F5]">스타리 페이지</h1>
        </div>
      </div>
      <NavBar />
    </div>
  );
}

export default StarryPage;
