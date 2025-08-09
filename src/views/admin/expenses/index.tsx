import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { MdDelete, MdRefresh } from 'react-icons/md';
import { fetchExpenses, fetchCategories, upsertExpense, deleteExpense, trySyncQueue, uploadReceipt } from 'lib/api';
import { subscribeRealtime } from 'lib/realtime';
import type { Expense, Category } from 'lib/types';

export default function ExpensesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category_id: '',
    occurred_on: new Date().toISOString().slice(0, 10),
    notes: '',
    file: null as File | null,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [cats, exps] = await Promise.all([
        fetchCategories(),
        fetchExpenses(`${filterMonth}-01`),
      ]);
      setCategories(cats);
      setExpenses(exps);
      setLoading(false);
    };
    load();
    const unsub = subscribeRealtime({
      onExpenseChange: async () => {
        const exps = await fetchExpenses(`${filterMonth}-01`);
        setExpenses(exps);
      },
    });
    return () => {
      unsub();
    };
  }, [filterMonth]);

  useEffect(() => {
    const onOnline = async () => {
      await trySyncQueue();
      const exps = await fetchExpenses(`${filterMonth}-01`);
      setExpenses(exps);
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [filterMonth]);

  const total = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const key = e.category_id || 'uncategorized';
      map[key] = (map[key] || 0) + (e.amount || 0);
    });
    return map;
  }, [expenses]);

  async function handleAdd() {
    if (!form.title || !form.amount) {
      toast({ status: 'warning', title: 'Title and amount are required' });
      return;
    }
    let imagePath: string | null = null;
    try {
      if (form.file) {
        imagePath = await uploadReceipt(form.file);
      }
    } catch (_) {
      // ignore upload errors; can retry later
    }
    const payload = {
      title: form.title,
      amount: Number(form.amount),
      category_id: form.category_id || null,
      occurred_on: new Date(form.occurred_on).toISOString(),
      notes: form.notes || null,
      images: imagePath ? [imagePath] : null,
    };
    await upsertExpense(payload as any);
    const exps = await fetchExpenses(`${filterMonth}-01`);
    setExpenses(exps);
    setForm({ title: '', amount: '', category_id: '', occurred_on: new Date().toISOString().slice(0, 10), notes: '', file: null });
    toast({ status: 'success', title: 'Expense saved (queued if offline)' });
  }

  async function handleDelete(id: string) {
    await deleteExpense(id);
    const exps = await fetchExpenses(`${filterMonth}-01`);
    setExpenses(exps);
    toast({ status: 'info', title: 'Expense deleted (queued if offline)' });
  }

  function exportCsv() {
    const summaryRows = Object.entries(byCategory).map(([catId, sum]) => [
      categories.find((c) => c.id === catId)?.name || 'Uncategorized',
      String(sum.toFixed(2)),
    ]);
    const rows = [
      ['Summary by Category', 'Amount'],
      ...summaryRows,
      [],
      ['Date', 'Title', 'Category', 'Amount', 'Currency', 'Notes'],
      ...expenses.map((e) => [
        e.occurred_on?.slice(0, 10) || '',
        e.title,
        categories.find((c) => c.id === e.category_id)?.name || '',
        String(e.amount ?? ''),
        e.currency || 'USD',
        e.notes || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses-${filterMonth}.csv`;
    link.click();
  }

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Expenses</Heading>
        <HStack>
          <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} w="auto" />
          <Button onClick={exportCsv}>Export CSV</Button>
          <IconButton aria-label="Refresh" icon={<MdRefresh />} onClick={async () => {
            setLoading(true);
            const exps = await fetchExpenses(`${filterMonth}-01`);
            setExpenses(exps);
            setLoading(false);
          }} />
        </HStack>
      </HStack>

      <Box borderWidth="1px" borderRadius="lg" p={4} mb={6}>
        <Heading size="sm" mb={3}>Add Expense</Heading>
        <SimpleGrid columns={2} gap={3}>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select placeholder="Category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input type="date" value={form.occurred_on} onChange={(e) => setForm({ ...form, occurred_on: e.target.value })} />
        </SimpleGrid>
        <Textarea mt={3} placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <Input mt={3} type="file" accept="image/*" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
        <Flex mt={3} gap={2}>
          <Button onClick={handleAdd} colorScheme="blue">Save</Button>
        </Flex>
      </Box>

      <Stat mb={4}>
        <StatLabel>Total this month</StatLabel>
        <StatNumber>${total.toFixed(2)}</StatNumber>
        <StatHelpText>{expenses.length} items</StatHelpText>
      </Stat>

      {loading ? (
        <Spinner />
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th isNumeric>Amount</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {expenses.map((e) => (
              <Tr key={e.id}>
                <Td>{e.occurred_on?.slice(0, 10)}</Td>
                <Td>{e.title}</Td>
                <Td>{categories.find((c) => c.id === e.category_id)?.name || '-'}</Td>
                <Td isNumeric>{e.amount?.toFixed(2)}</Td>
                <Td>
                  <IconButton aria-label="Delete" icon={<MdDelete />} size="sm" onClick={() => handleDelete(e.id)} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}


