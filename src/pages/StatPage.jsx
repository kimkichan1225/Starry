import NavBar from '../components/NavBar';

function StatPage() {
  return (
    <div className="relative min-h-screen bg-[#FAF5FF]">
      <div className="flex flex-col min-h-screen pb-20">
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-[#6155F5]">응답 통계 페이지</h1>
        </div>
      </div>
      <NavBar />
    </div>
  );
}

export default StatPage;
