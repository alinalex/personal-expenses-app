'use client'
import { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
export default function ExpensesChart({ chartData, domain }: { chartData: any[], domain: number[] }) {

  const [chartHeight, setChartHeight] = useState(730);
  const renderCustomBarLabel = ({ payload, x, y, width, height, value, name }: { payload: any, x: any, y: any, width: any, height: any, value: any, name: any }) => {
    console.log('height', height);
    const dy = height < 0 ? height - 7 : -7;
    // const nameDy = height < 0 ? height - 30 : height + 30;
    const nameDy = height < 0 ? height - 30 : (domain[0] === 0 ? height + 15 : height + 30);
    return (
      <>
        <text x={x + width / 2} y={y} fill="#666" textAnchor="middle" dy={dy}>
          {`${value.toLocaleString()}`}
        </text>
        <text x={x + width / 2} y={y} fill="#666" textAnchor="middle" dy={nameDy} style={{ fontSize: '12px' }}>
          {`${name}`}
        </text>
      </>
    )
  };

  const chartWrapper = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    setChartHeight(chartWrapper.current?.clientWidth as number);
  }, [])

  return (
    <div className="my-6" ref={chartWrapper}>
      <BarChart width={chartHeight} height={500} data={chartData}>
        <XAxis interval={0} tick={false} />
        <YAxis dataKey="value" type="number" domain={domain} padding={{ bottom: 25, top: 25 }} />
        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
        <Bar dataKey="value" barSize={20} fill="#8884d8" label={renderCustomBarLabel} />
      </BarChart>
    </div>
  )
}