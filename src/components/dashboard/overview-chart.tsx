
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useState, useEffect } from "react";
import { ExternalTicket } from "@/lib/types";
import { subMonths, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface OverviewChartProps {
    tickets: ExternalTicket[];
}

export function OverviewChart({ tickets }: OverviewChartProps) {
  const [chartData, setChartData] = useState<any[] | null>(null);

  useEffect(() => {
    // Generate data only on the client-side to avoid hydration mismatch
    const data = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return {
            month: format(d, 'MMM', { locale: ptBR }),
            monthFull: startOfMonth(d).toISOString(),
            total: 0,
        };
    });

    tickets.forEach(ticket => {
        const ticketMonth = startOfMonth(new Date(ticket.createdAt)).toISOString();
        const monthData = data.find(m => m.monthFull === ticketMonth);
        if (monthData) {
            monthData.total += 1;
        }
    });

    setChartData(data);
  }, [tickets]);


  if (!chartData) {
    // Render a skeleton or empty state while data is being generated on the client
    return (
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral de Atendimentos</CardTitle>
            <CardDescription>Total de chamados abertos nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted" />
          </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral de Atendimentos</CardTitle>
        <CardDescription>Total de chamados abertos nos últimos 6 meses.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

    