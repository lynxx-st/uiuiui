import { useEffect, useState } from 'react';
import { Box, Button, Heading, HStack, IconButton, Input, SimpleGrid, Table, Tbody, Td, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { MdDelete } from 'react-icons/md';
import { fetchCategories, upsertCategory, deleteCategory } from 'lib/api';
import type { Category } from 'lib/types';

export default function CategoriesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const cats = await fetchCategories();
      setCategories(cats);
      setLoading(false);
    };
    load();
  }, []);

  async function addCategory() {
    if (!name.trim()) return;
    await upsertCategory({ name });
    const cats = await fetchCategories();
    setCategories(cats);
    setName('');
    toast({ status: 'success', title: 'Category saved (queued if offline)' });
  }

  async function removeCategory(id: string) {
    await deleteCategory(id);
    const cats = await fetchCategories();
    setCategories(cats);
    toast({ status: 'info', title: 'Category deleted (queued if offline)' });
  }

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Categories</Heading>
      </HStack>

      <Box borderWidth="1px" borderRadius="lg" p={4} mb={6}>
        <Heading size="sm" mb={3}>Add Category</Heading>
        <SimpleGrid columns={2} gap={3}>
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={addCategory} colorScheme="blue">Save</Button>
        </SimpleGrid>
      </Box>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {categories.map((c) => (
            <Tr key={c.id}>
              <Td>{c.name}</Td>
              <Td>
                <IconButton aria-label="Delete" icon={<MdDelete />} size="sm" onClick={() => removeCategory(c.id)} />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}


