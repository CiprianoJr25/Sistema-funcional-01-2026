
"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ExternalTicket, InternalTicket } from "@/lib/types"
import { useMemo } from "react"

interface StatusChartProps {
  title: string
  description: string
  data: (ExternalTicket | InternalTicket)[]
  type?: "external" | "internal"
}

const STATUS_COLORS = {
  pendente: "hsl(var(--chart-1))",
  'em andamento': "hsl(var(--chart-2))",
  concluído: "hsl(var(--chart-3))",
  cancelado: "hsl(var(--chart-4))",
}

export function StatusChart({ title, description, data, type = "external" }: StatusChartProps) {
  
  const chartData = useMemo(() => {
    const statusCounts = data.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      value: count,
      fill: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "hsl(var(--muted))",
    }))
  }, [data])


  const total = useMemo(() => chartData.reduce((acc, curr) => acc + curr.value, 0), [chartData]);


  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
            <p>Não há {type === 'internal' ? 'tarefas internas' : 'chamados'} para exibir no gráfico.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{}}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.status}`} fill={entry.fill} />
              ))}
            </Pie>
             <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-3xl font-bold"
              >
                {total.toLocaleString()}
            </text>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
