import { useState } from 'react';
import { Box, Button, Flex, FormControl, FormLabel, Heading, Icon, Input, InputGroup, InputRightElement, Text, useColorModeValue, useToast } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';
import DefaultAuth from 'layouts/auth/Default';
import illustration from 'assets/img/auth/auth.png';
import { signInWithGoogle, signUpWithEmail } from 'lib/api';

export default function SignUp() {
  const toast = useToast();
  const textColor = useColorModeValue('navy.700', 'white');
  const textColorSecondary = 'gray.400';
  const googleBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.200');
  const googleText = useColorModeValue('navy.700', 'white');
  const googleHover = useColorModeValue({ bg: 'gray.200' }, { bg: 'whiteAlpha.300' });
  const googleActive = useColorModeValue({ bg: 'secondaryGray.300' }, { bg: 'whiteAlpha.200' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  async function handleEmailSignUp() {
    const { error } = await signUpWithEmail(email, password);
    if (error) toast({ status: 'error', title: error.message });
    else toast({ status: 'success', title: 'Check your email to confirm your account' });
  }

  return (
    <DefaultAuth illustrationBackground={illustration} image={illustration}>
      <Flex maxW={{ base: '100%', md: 'max-content' }} w="100%" mx={{ base: 'auto', lg: '0px' }} me="auto" h="100%" alignItems="start" justifyContent="center" mb={{ base: '30px', md: '60px' }} px={{ base: '25px', md: '0px' }} mt={{ base: '40px', md: '14vh' }} flexDirection="column">
        <Box me="auto">
          <Heading color={textColor} fontSize="36px" mb="10px">Sign Up</Heading>
          <Text mb="36px" ms="4px" color={textColorSecondary} fontWeight="400" fontSize="md">Create your account</Text>
        </Box>
        <Flex zIndex="2" direction="column" w={{ base: '100%', md: '420px' }} maxW="100%" background="transparent" borderRadius="15px" mx={{ base: 'auto', lg: 'unset' }} me="auto" mb={{ base: '20px', md: 'auto' }}>
          <Button fontSize="sm" me="0px" mb="26px" py="15px" h="50px" borderRadius="16px" bg={googleBg} color={googleText} fontWeight="500" _hover={googleHover} _active={googleActive} _focus={googleActive} onClick={() => signInWithGoogle()}>
            <Icon as={FcGoogle} w="20px" h="20px" me="10px" /> Sign up with Google
          </Button>
          <FormControl>
            <FormLabel display="flex" ms="4px" fontSize="sm" fontWeight="500" color={textColor} mb="8px">Email</FormLabel>
            <Input isRequired variant="auth" fontSize="sm" type="email" placeholder="you@example.com" mb="24px" fontWeight="500" size="lg" value={email} onChange={(e) => setEmail(e.target.value)} />
            <FormLabel ms="4px" fontSize="sm" fontWeight="500" color={textColor} display="flex">Password</FormLabel>
            <InputGroup size="md">
              <Input isRequired fontSize="sm" placeholder="Min. 8 characters" mb="24px" size="lg" type={show ? 'text' : 'password'} variant="auth" value={password} onChange={(e) => setPassword(e.target.value)} />
              <InputRightElement display="flex" alignItems="center" mt="4px">
                <Icon color={textColorSecondary} _hover={{ cursor: 'pointer' }} as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye} onClick={() => setShow(!show)} />
              </InputRightElement>
            </InputGroup>
            <Button fontSize="sm" variant="brand" fontWeight="500" w="100%" h="50" mb="24px" onClick={handleEmailSignUp}>Sign Up</Button>
          </FormControl>
        </Flex>
      </Flex>
    </DefaultAuth>
  );
}


