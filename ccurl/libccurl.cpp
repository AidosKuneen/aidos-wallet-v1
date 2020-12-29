/*
 * Copyright (c) 2016, Shinya Yagyu
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/time.h>
#include <stddef.h>

#ifdef _MSC_VER
#include <intrin.h>
#else
#include <x86intrin.h>
#endif

#if defined(__linux) || defined(__APPLE__)
#include <unistd.h>
#elif defined(__MINGW64__) 
#include <windows.h>
#include <winbase.h>
#elif _WIN32
#include <windows.h>
#include <process.h> 
#endif

#if defined(_MSC_VER) || defined(__MINGW64__)
#include <malloc.h>
#endif /* defined(_MSC_VER) || defined(__MINGW32__) */

#ifndef _MSC_VER
#include <pthread.h>
#endif

#ifdef _WIN32
HANDLE	mutex = CreateMutex(NULL,FALSE,NULL);
#else
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
#endif

// see https://gist.github.com/t-mat/3769328#file-cpuid-cpp
#if defined(_MSC_VER)
static void get_cpuid(void* p, int i) {
  __cpuid((int*)p, i);
}
static void get_cpuidex(void* p, int i, int c) {
  __cpuidex((int*)p, i, c);
}

#elif defined(__linux) || defined(__APPLE__)
#include <cpuid.h>
static void get_cpuid(void* p, int i) {
  int* a = (int*) p;
  __cpuid(i, a[0], a[1], a[2], a[3]);
}
static void get_cpuidex(void* p, int i, int c) {
  int* a = (int*) p;
  __cpuid_count(i, c, a[0], a[1], a[2], a[3]);
}
#endif

struct CpuInfo {
    int cpui[4];

    CpuInfo(int infoType) {
        get_cpuid(cpui, infoType);
    }

    CpuInfo(int infoType, uint32_t ecxValue) {
        get_cpuidex(cpui, infoType, ecxValue);
    }
};

#define HBITS 0xFFFFFFFFFFFFFFFFuLL
#define LBITS 0x0000000000000000uLL
#define HASH_LENGTH 243 //trits
#define STATE_LENGTH 3 * HASH_LENGTH //trits : 729
#define TX_LENGTH 2673 //trytes

#define LO00 0xDB6DB6DB6DB6DB6DuLL //0b1101101101101101101101101101101101101101101101101101101101101101L;
#define HI00 0xB6DB6DB6DB6DB6DBuLL //0b1011011011011011011011011011011011011011011011011011011011011011L;
#define LO10 0xF1F8FC7E3F1F8FC7uLL //0b1111000111111000111111000111111000111111000111111000111111000111L;
#define HI10 0x8FC7E3F1F8FC7E3FuLL //0b1000111111000111111000111111000111111000111111000111111000111111L;
#define LO20 0x7FFFE00FFFFC01FFuLL //0b0111111111111111111000000000111111111111111111000000000111111111L;
#define HI20 0xFFC01FFFF803FFFFuLL //0b1111111111000000000111111111111111111000000000111111111111111111L;
#define LO30 0xFFC0000007FFFFFFuLL //0b1111111111000000000000000000000000000111111111111111111111111111L;
#define HI30 0x003FFFFFFFFFFFFFuLL //0b0000000000111111111111111111111111111111111111111111111111111111L;
#define LO40 0xFFFFFFFFFFFFFFFFuLL //0b1111111111111111111111111111111111111111111111111111111111111111L;
#define HI40 0xFFFFFFFFFFFFFFFFuLL //0b1111111111111111111111111111111111111111111111111111111111111111L;

#define LO01 0x6DB6DB6DB6DB6DB6uLL //0b0110110110110110110110110110110110110110110110110110110110110110
#define HI01 0xDB6DB6DB6DB6DB6DuLL //0b1101101101101101101101101101101101101101101101101101101101101101
#define LO11 0xF8FC7E3F1F8FC7E3uLL //0b1111100011111100011111100011111100011111100011111100011111100011
#define HI11 0xC7E3F1F8FC7E3F1FuLL //0b1100011111100011111100011111100011111100011111100011111100011111
#define LO21 0xC01FFFF803FFFF00uLL //0b1100000000011111111111111111100000000011111111111111111100000000
#define HI21 0x3FFFF007FFFE00FFuLL //0b0011111111111111111100000000011111111111111111100000000011111111
#define LO31 0x00000FFFFFFFFFFFuLL //0b0000000000000000000011111111111111111111111111111111111111111111
#define HI31 0xFFFFFFFFFFFE0000uLL //0b1111111111111111111111111111111111111111111111100000000000000000
#define LO41 0x000000000001FFFFuLL //0b0000000000000000000000000000000000000000000000011111111111111111
#define HI41 0xFFFFFFFFFFFFFFFFuLL //0b1111111111111111111111111111111111111111111111111111111111111111

// loop_cpu index
#define L_IDX 0
#define H_IDX 1

#ifndef EXPORT
#if defined(_WIN32) || defined(_MSC_VER)
#define EXPORT __declspec(dllexport)
#else
#define EXPORT
#endif
#endif

typedef struct{
    int corenum;
    long long count;
    long long time;
    char * trytes;
} RESULT;

#ifdef __cplusplus
extern "C"{
#endif
    EXPORT void ccurl_pow_finalize();
    EXPORT void ccurl_pow_interrupt();
    EXPORT char* ccurl_pow(char* trytes, int minWeightMagnitude, RESULT *result);
#ifdef __cplusplus
}
#endif

int getCpuNum()
{
    //return 1;// TODO debug
#if defined(__linux) || defined(__APPLE__)
    // for linux
    return sysconf(_SC_NPROCESSORS_ONLN);
#elif defined(__MINGW64__) || defined(__MINGW32__) || defined(_MSC_VER)
    // for windows and wine
    SYSTEM_INFO info;
    GetSystemInfo(&info);
    return info.dwNumberOfProcessors;
#endif
}

bool hasAvx2(int n)
{
    // see https://docs.microsoft.com/en-us/cpp/intrinsics/cpuid-cpuidex?redirectedfrom=MSDN&view=msvc-160
    bool avx2 = false;

    CpuInfo cpuInfo7(7, 0);
    if (cpuInfo7.cpui[1] & 1 <<  5) {
        avx2 = true;
    }

    if (n == 1) {
        char buf[48];

        // Intel / AMD
        CpuInfo cpuInfo0(0);
        printf("0x%x\n", cpuInfo0.cpui[0]);
        memcpy(buf, &cpuInfo0.cpui[1], 4);
        memcpy(buf+4, &cpuInfo0.cpui[3], 4);
        memcpy(buf+8, &cpuInfo0.cpui[2], 4);
        buf[12] = '\0';
        printf("%s\n", buf);

        // Processor Name, Freq
        CpuInfo cpuInfo2(0x80000002);
        memcpy(buf, cpuInfo2.cpui, 16);
        CpuInfo cpuInfo3(0x80000003);
        memcpy(buf+16, cpuInfo3.cpui, 16);
        CpuInfo cpuInfo4(0x80000004);
        memcpy(buf+32, cpuInfo4.cpui, 16);
        printf("%s\n", buf);

        // SIMD 
        CpuInfo cpuInfo1(1);
        printf("MMX:      %s\n", cpuInfo1.cpui[3] & 1 << 23 ? "OK" : "NG");
        printf("SSE:      %s\n", cpuInfo1.cpui[3] & 1 << 25 ? "OK" : "NG");
        printf("AVX:      %s\n", cpuInfo1.cpui[2] & 1 << 28 ? "OK" : "NG");
        printf("FMA:      %s\n", cpuInfo1.cpui[2] & 1 << 12 ? "OK" : "NG");

        CpuInfo cpuInfo7(7, 0);
        printf("AVX2:     %s\n", cpuInfo7.cpui[1] & 1 <<  5 ? "OK" : "NG");
        printf("AVX512F:  %s\n", cpuInfo7.cpui[1] & 1 << 16 ? "OK" : "NG");
        printf("AVX512PF: %s\n", cpuInfo7.cpui[1] & 1 << 26 ? "OK" : "NG");
        printf("AVX512ER: %s\n", cpuInfo7.cpui[1] & 1 << 27 ? "OK" : "NG");
        printf("AVX512CD: %s\n", cpuInfo7.cpui[1] & 1 << 28 ? "OK" : "NG");
        printf("SHA:      %s\n", cpuInfo7.cpui[1] & 1 << 29 ? "OK" : "NG");

        printf("hasAvx2:  %d\n", avx2);
    }

    return avx2;
}

const int indices[] = {
    //0    1    2    3    4    5    6    7    8    9    0    1    2    3    4    5    6    7    8    9
      0, 364, 728, 363, 727, 362, 726, 361, 725, 360, 724, 359, 723, 358, 722, 357, 721, 356, 720, 355, //  20
    719, 354, 718, 353, 717, 352, 716, 351, 715, 350, 714, 349, 713, 348, 712, 347, 711, 346, 710, 345, //  40
    709, 344, 708, 343, 707, 342, 706, 341, 705, 340, 704, 339, 703, 338, 702, 337, 701, 336, 700, 335, //  60
    699, 334, 698, 333, 697, 332, 696, 331, 695, 330, 694, 329, 693, 328, 692, 327, 691, 326, 690, 325, //  80
    689, 324, 688, 323, 687, 322, 686, 321, 685, 320, 684, 319, 683, 318, 682, 317, 681, 316, 680, 315, // 100
    679, 314, 678, 313, 677, 312, 676, 311, 675, 310, 674, 309, 673, 308, 672, 307, 671, 306, 670, 305, // 120
    669, 304, 668, 303, 667, 302, 666, 301, 665, 300, 664, 299, 663, 298, 662, 297, 661, 296, 660, 295, // 140
    659, 294, 658, 293, 657, 292, 656, 291, 655, 290, 654, 289, 653, 288, 652, 287, 651, 286, 650, 285, // 160
    649, 284, 648, 283, 647, 282, 646, 281, 645, 280, 644, 279, 643, 278, 642, 277, 641, 276, 640, 275, // 180
    639, 274, 638, 273, 637, 272, 636, 271, 635, 270, 634, 269, 633, 268, 632, 267, 631, 266, 630, 265, // 200
    629, 264, 628, 263, 627, 262, 626, 261, 625, 260, 624, 259, 623, 258, 622, 257, 621, 256, 620, 255, // 220
    619, 254, 618, 253, 617, 252, 616, 251, 615, 250, 614, 249, 613, 248, 612, 247, 611, 246, 610, 245, // 240
    609, 244, 608, 243, 607, 242, 606, 241, 605, 240, 604, 239, 603, 238, 602, 237, 601, 236, 600, 235, // 260
    599, 234, 598, 233, 597, 232, 596, 231, 595, 230, 594, 229, 593, 228, 592, 227, 591, 226, 590, 225, // 280
    589, 224, 588, 223, 587, 222, 586, 221, 585, 220, 584, 219, 583, 218, 582, 217, 581, 216, 580, 215, // 300
    579, 214, 578, 213, 577, 212, 576, 211, 575, 210, 574, 209, 573, 208, 572, 207, 571, 206, 570, 205, // 320
    569, 204, 568, 203, 567, 202, 566, 201, 565, 200, 564, 199, 563, 198, 562, 197, 561, 196, 560, 195, // 340
    559, 194, 558, 193, 557, 192, 556, 191, 555, 190, 554, 189, 553, 188, 552, 187, 551, 186, 550, 185, // 360
    549, 184, 548, 183, 547, 182, 546, 181, 545, 180, 544, 179, 543, 178, 542, 177, 541, 176, 540, 175, // 380
    539, 174, 538, 173, 537, 172, 536, 171, 535, 170, 534, 169, 533, 168, 532, 167, 531, 166, 530, 165, // 400
    529, 164, 528, 163, 527, 162, 526, 161, 525, 160, 524, 159, 523, 158, 522, 157, 521, 156, 520, 155, // 420
    519, 154, 518, 153, 517, 152, 516, 151, 515, 150, 514, 149, 513, 148, 512, 147, 511, 146, 510, 145, // 440
    509, 144, 508, 143, 507, 142, 506, 141, 505, 140, 504, 139, 503, 138, 502, 137, 501, 136, 500, 135, // 460
    499, 134, 498, 133, 497, 132, 496, 131, 495, 130, 494, 129, 493, 128, 492, 127, 491, 126, 490, 125, // 480
    489, 124, 488, 123, 487, 122, 486, 121, 485, 120, 484, 119, 483, 118, 482, 117, 481, 116, 480, 115, // 500
    479, 114, 478, 113, 477, 112, 476, 111, 475, 110, 474, 109, 473, 108, 472, 107, 471, 106, 470, 105, // 520
    469, 104, 468, 103, 467, 102, 466, 101, 465, 100, 464,  99, 463,  98, 462,  97, 461,  96, 460,  95, // 540
    459,  94, 458,  93, 457,  92, 456,  91, 455,  90, 454,  89, 453,  88, 452,  87, 451,  86, 450,  85, // 560
    449,  84, 448,  83, 447,  82, 446,  81, 445,  80, 444,  79, 443,  78, 442,  77, 441,  76, 440,  75, // 580
    439,  74, 438,  73, 437,  72, 436,  71, 435,  70, 434,  69, 433,  68, 432,  67, 431,  66, 430,  65, // 600
    429,  64, 428,  63, 427,  62, 426,  61, 425,  60, 424,  59, 423,  58, 422,  57, 421,  56, 420,  55, // 620
    419,  54, 418,  53, 417,  52, 416,  51, 415,  50, 414,  49, 413,  48, 412,  47, 411,  46, 410,  45, // 640
    409,  44, 408,  43, 407,  42, 406,  41, 405,  40, 404,  39, 403,  38, 402,  37, 401,  36, 400,  35, // 660
    399,  34, 398,  33, 397,  32, 396,  31, 395,  30, 394,  29, 393,  28, 392,  27, 391,  26, 390,  25, // 680
    389,  24, 388,  23, 387,  22, 386,  21, 385,  20, 384,  19, 383,  18, 382,  17, 381,  16, 380,  15, // 700
    379,  14, 378,  13, 377,  12, 376,  11, 375,  10, 374,   9, 373,   8, 372,   7, 371,   6, 370,   5, // 720
    369,   4, 368,   3, 367,   2, 366,   1, 365,   0  // 730
};

const char truthTable[] = { 1, 0, -1, 0, 1, -1, 0, 0, -1, 1, 0 };

const char tryte2trit_table[][3] = {
    {  0,  0,  0 }, {  1,  0,  0 }, { -1,  1,  0 }, {  0,  1,  0 }, {  1,  1,  0 }, //  5
    { -1, -1,  1 }, {  0, -1,  1 }, {  1, -1,  1 }, { -1,  0,  1 }, {  0,  0,  1 }, // 10
    {  1,  0,  1 }, { -1,  1,  1 }, {  0,  1,  1 }, {  1,  1,  1 }, { -1, -1, -1 }, // 15
    {  0, -1, -1 }, {  1, -1, -1 }, { -1,  0, -1 }, {  0,  0, -1 }, {  1,  0, -1 }, // 20
    { -1,  1, -1 }, {  0,  1, -1 }, {  1,  1, -1 }, { -1, -1,  0 }, {  0, -1,  0 }, // 25
    {  1, -1,  0 }, { -1,  0,  0 } // 27
};

static int stop = 0, running = 0;

void tx2trit(char tryte[], char trit[])
{
    int i = 0;
    if (strlen(tryte) != TX_LENGTH) {
        fprintf(stderr, "illegal tx length.\n");
        exit(1);
    }
    for (i = 0; i < TX_LENGTH; i++) {
        if (!(tryte[i] == '9' || (tryte[i] >= 'A' && tryte[i] <= 'Z'))) {
            fprintf(stderr, "illegal tryte.\n");
            exit(1);
        }
        int ch = 0;
        if (tryte[i] != '9') {
            ch = tryte[i] - 'A' + 1;
        }
        trit[i * 3] = tryte2trit_table[ch][0];
        trit[i * 3 + 1] = tryte2trit_table[ch][1];
        trit[i * 3 + 2] = tryte2trit_table[ch][2];
    }
}

void hash2tryte(char trit[], char tryte[])
{
    int i = 0;
    for (i = 0; i < HASH_LENGTH / 3; i++) {
        int n = trit[i * 3] + trit[i * 3 + 1] * 3 + trit[i * 3 + 2] * 9;
        if (n < 0) {
            n += 27;
        }
        if (n > 27 || n < 0) {
            fprintf(stderr, "illegal trit. %d\n", n);
            exit(1);
        }
        if (n == 0) {
            tryte[i] = '9';
        }
        else {
            tryte[i] = (char)n + 'A' - 1;
        }
    }
    tryte[HASH_LENGTH / 3] = 0;
}

void transform(char state[])
{
    int r = 0, i = 0;
    char copy[STATE_LENGTH] = { 0 };
    for (r = 0; r < 27; r++) {
        memcpy(copy, state, STATE_LENGTH);
        for (i = 0; i < STATE_LENGTH; i++) {
            int aa = indices[i];
            int bb = indices[i + 1];
            state[i] = truthTable[copy[aa] + (copy[bb] << 2) + 5];
        }
    }
}

void absorb(char state[], char in[], int size)
{
    int len = 0, offset = 0;
    for (offset = 0; offset < size; offset += len) {
        len = 243;
        if (size < 243) {
            len = size;
        }
        memcpy(state, in + offset, len);
        transform(state);
    }
}

void transform64(__m128i* lmid, __m128i* hmid)
{
    int j, r, t1, t2;
      __m128i one = _mm_set_epi64x(HBITS, HBITS);
    __m128i alpha, beta, gamma, delta,nalpha;
    __m128i *lto = lmid + STATE_LENGTH, *hto = hmid + STATE_LENGTH;
    __m128i *lfrom = lmid, *hfrom = hmid;
    for (r = 0; r < 26; r++) {
        for (j = 0; j < STATE_LENGTH; j++) {
            t1 = indices[j];
            t2 = indices[j + 1];

            alpha = lfrom[t1];
            beta = hfrom[t1];
            gamma = hfrom[t2];
            //(alpha | (~gamma)) & (lfrom[t2] ^ beta);
            nalpha = _mm_andnot_si128(alpha,gamma);
            delta =  _mm_andnot_si128(nalpha, _mm_xor_si128(lfrom[t2],beta)); 

            lto[j] = _mm_andnot_si128(delta,one);  //~delta;
            hto[j] = _mm_or_si128(_mm_xor_si128(alpha,gamma),delta); //(alpha ^ gamma) | delta;
        }
        __m128i *lswap = lfrom, *hswap = hfrom;
        lfrom = lto;
        hfrom = hto;
        lto = lswap;
        hto = hswap;
    }
    for (j = 0; j < HASH_LENGTH; j++) {
        t1 = indices[j];
        t2 = indices[j + 1];

        alpha = lfrom[t1];
        beta = hfrom[t1];
        gamma = hfrom[t2];
        nalpha = _mm_andnot_si128(alpha,gamma);
        delta =  _mm_andnot_si128(nalpha, _mm_xor_si128(lfrom[t2],beta)); 
        lto[j] = _mm_andnot_si128(delta,one);  //~delta;
            hto[j] = _mm_or_si128(_mm_xor_si128(alpha,gamma),delta); //(alpha ^ gamma) | delta;
     }
}

void transform64_AVX(
    // dim 1 Lo/Hi, 2 from/to 
    __m128i lhmid[2][2][STATE_LENGTH])  // immutable
{
    // switcher
    int from = 0;
    int to = !from;

    int j, r, t1, t2, t3;

    __m256i one = _mm256_set_epi64x(HBITS, HBITS, HBITS, HBITS);
    __m256i alpha, beta, gamma, epsilon, delta, nalpha, ltemp, htemp, index;
    
    for (r = 0; r < 26; r++) {
        for (j = 0; j < STATE_LENGTH-1; j+=2) {
            t1 = indices[j];
            t2 = indices[j + 1];
            t3 = indices[j + 2];

            // too slowly gather lol
            //index = _mm256_set_epi64x(
            //    (L_IDX * 2 * STATE_LENGTH + from * STATE_LENGTH + t1) * 2 + 1,
            //    (L_IDX * 2 * STATE_LENGTH + from * STATE_LENGTH + t1) * 2,
            //    (L_IDX * 2 * STATE_LENGTH + from * STATE_LENGTH + t2) * 2 + 1,
            //    (L_IDX * 2 * STATE_LENGTH + from * STATE_LENGTH + t2) * 2
            //);
            //alpha = _mm256_i64gather_epi64(lhmid, index, 8);

            alpha = _mm256_set_m128i(lhmid[L_IDX][from][t1], lhmid[L_IDX][from][t2]);

            epsilon = _mm256_set_m128i(lhmid[L_IDX][from][t2], lhmid[L_IDX][from][t3]);

            beta = _mm256_set_m128i(lhmid[H_IDX][from][t1], lhmid[H_IDX][from][t2]);
            gamma = _mm256_set_m128i(lhmid[H_IDX][from][t2], lhmid[H_IDX][from][t3]);

            // (alpha | (~gamma)) & (epsilon ^ beta);
            nalpha = _mm256_andnot_si256(alpha, gamma);
            delta = _mm256_andnot_si256(nalpha, _mm256_xor_si256(epsilon, beta)); 

            ltemp = _mm256_andnot_si256(delta, one);  // ~delta;
            htemp = _mm256_or_si256(_mm256_xor_si256(alpha, gamma), delta); // (alpha ^ gamma) | delta;

            _mm256_storeu2_m128i(&lhmid[L_IDX][to][j], &lhmid[L_IDX][to][j+1], ltemp);
            _mm256_storeu2_m128i(&lhmid[H_IDX][to][j], &lhmid[H_IDX][to][j+1], htemp);
        }

        // loop end
        t1 = indices[STATE_LENGTH-1];
        t2 = indices[STATE_LENGTH];

        alpha = _mm256_zextsi128_si256(lhmid[L_IDX][from][t1]);
        epsilon = _mm256_zextsi128_si256(lhmid[L_IDX][from][t2]);
        beta = _mm256_zextsi128_si256(lhmid[H_IDX][from][t1]);
        gamma = _mm256_zextsi128_si256(lhmid[H_IDX][from][t2]);

        // (alpha | (~gamma)) & (epsilon ^ beta);
        nalpha = _mm256_andnot_si256(alpha, gamma);
        delta = _mm256_andnot_si256(nalpha, _mm256_xor_si256(epsilon, beta)); 

        ltemp = _mm256_andnot_si256(delta, one);  // ~delta;
        htemp = _mm256_or_si256(_mm256_xor_si256(alpha, gamma), delta); // (alpha ^ gamma) | delta;

        lhmid[L_IDX][to][STATE_LENGTH-1] = _mm256_extractf128_si256(ltemp, 0);
        lhmid[H_IDX][to][STATE_LENGTH-1] = _mm256_extractf128_si256(htemp, 0);

        // switch side
        from = !from;
        to = !to;
    }

    for (j = 0; j < HASH_LENGTH-1; j+=2) {
        t1 = indices[j];
        t2 = indices[j + 1];
        t3 = indices[j + 2];

        alpha = _mm256_set_m128i(lhmid[L_IDX][from][t1], lhmid[L_IDX][from][t2]);
        epsilon = _mm256_set_m128i(lhmid[L_IDX][from][t2], lhmid[L_IDX][from][t3]);

        beta = _mm256_set_m128i(lhmid[H_IDX][from][t1], lhmid[H_IDX][from][t2]);
        gamma = _mm256_set_m128i(lhmid[H_IDX][from][t2], lhmid[H_IDX][from][t3]);

        //(alpha | (~gamma)) & (lfrom[t2] ^ beta);
        nalpha = _mm256_andnot_si256(alpha, gamma);
        delta = _mm256_andnot_si256(nalpha, _mm256_xor_si256(epsilon, beta));

        ltemp = _mm256_andnot_si256(delta, one);  //~delta;
        htemp = _mm256_or_si256(_mm256_xor_si256(alpha, gamma), delta); //(alpha ^ gamma) | delta;

        _mm256_storeu2_m128i(&lhmid[L_IDX][to][j], &lhmid[L_IDX][to][j+1], ltemp);
        _mm256_storeu2_m128i(&lhmid[H_IDX][to][j], &lhmid[H_IDX][to][j+1], htemp);
    }

    // loop end
    t1 = indices[HASH_LENGTH-1];
    t2 = indices[HASH_LENGTH];

    alpha = _mm256_zextsi128_si256(lhmid[L_IDX][from][t1]);
    epsilon = _mm256_zextsi128_si256(lhmid[L_IDX][from][t2]);
    beta = _mm256_zextsi128_si256(lhmid[H_IDX][from][t1]);
    gamma = _mm256_zextsi128_si256(lhmid[H_IDX][from][t2]);

    // (alpha | (~gamma)) & (epsilon ^ beta);
    nalpha = _mm256_andnot_si256(alpha, gamma);
    delta = _mm256_andnot_si256(nalpha, _mm256_xor_si256(epsilon, beta)); 

    ltemp = _mm256_andnot_si256(delta, one);  // ~delta;
    htemp = _mm256_or_si256(_mm256_xor_si256(alpha, gamma), delta); // (alpha ^ gamma) | delta;

    lhmid[L_IDX][to][HASH_LENGTH-1] = _mm256_extractf128_si256(ltemp, 0);
    lhmid[H_IDX][to][HASH_LENGTH-1] = _mm256_extractf128_si256(htemp, 0);
}

int incr(__m128i* mid_low, __m128i* mid_high)
{
    int i;
    __m128i carry;
    alignas(16) unsigned long long c[2]={0};
    for (i = 5; i < HASH_LENGTH && (i == 5 || c[0] ); i++) {
        __m128i low = mid_low[i], high = mid_high[i];
        mid_low[i] = _mm_xor_si128(high,low);
        mid_high[i] = low;
        carry = _mm_andnot_si128(low,high);
       _mm_store_si128 ((__m128i*)c,carry);
    }
    return i == HASH_LENGTH;
}

int incr_AVX(
    __m128i mid_lo[STATE_LENGTH],  // mutable
    __m128i mid_hi[STATE_LENGTH]) // mutable
{
    __m256i mlo, mhi, carry, hxl;

    // count 5 and 6
    mlo = _mm256_set_m128i(mid_lo[6], mid_lo[5]);
    mhi = _mm256_set_m128i(mid_hi[6], mid_hi[5]);
    carry = _mm256_andnot_si256(mlo, mhi);

    // set count 5
    hxl = _mm256_xor_si256(mhi, mlo);
    mid_lo[5] = _mm256_extractf128_si256(hxl, 0);
    mid_hi[5] = _mm256_extractf128_si256(mlo, 0);

    // check count 5 carry at count 6 start
    if (!_mm256_extract_epi64(carry, 0)) {
        return 0;
    }

    // set count 6
    mid_lo[6] = _mm256_extractf128_si256(hxl, 1);    
    mid_hi[6] = _mm256_extractf128_si256(mlo, 1);

    // 7 to HASH_LENGTH-1(242)
    for (int i = 7; i < HASH_LENGTH; i+=2) {

        // check before cycle count+1 carry 
        if (!_mm256_extract_epi64(carry, 2)) {
            return 0;
        }

        mlo = _mm256_set_m128i(mid_lo[i+1], mid_lo[i]);
        mhi = _mm256_set_m128i(mid_hi[i+1], mid_hi[i]);
        carry = _mm256_andnot_si256(mlo, mhi);

        if (!_mm256_extract_epi64(carry, 0)) {
            // update i 
            mid_lo[i] = _mm256_extracti128_si256(_mm256_xor_si256(mhi, mlo), 0);
            mid_hi[i] = _mm256_extracti128_si256(mlo, 0);

            return 0;
        }
        
        // update i, i+1
        _mm256_storeu2_m128i(&mid_lo[i+1], &mid_lo[i], _mm256_xor_si256(mhi, mlo));
        _mm256_storeu2_m128i(&mid_hi[i+1], &mid_hi[i], mlo);
    }

    return 1;
}

void seri(__m128i* low, __m128i* high, int n, char* r)
{
    int i = 0, index = 0;
    alignas(16) unsigned long long c[2]={0};

    if (n > 63) {
        n -= 64;
        index = 1;
    }
    for (i = 0; i < HASH_LENGTH; i++) {
       _mm_store_si128 ((__m128i*)c,low[i]);
        unsigned long long ll = (c[index] >> n) & 1;
       _mm_store_si128 ((__m128i*)c,high[i]);
        unsigned long long hh = (c[index] >> n) & 1;
        if (hh == 0 && ll == 1) {
            r[i] = -1;
        }
        if (hh == 1 && ll == 1) {
            r[i] = 0;
        }
        if (hh == 1 && ll == 0) {
            r[i] = 1;
        }
    }
}

inline int readStop(){
    int stop_=0;
#ifdef _WIN32
    WaitForSingleObject(mutex, INFINITE );
#else
    pthread_mutex_lock(&mutex);
#endif
    stop_=stop;
#ifdef _WIN32
 	ReleaseMutex(mutex);
#else
    pthread_mutex_unlock(&mutex);
#endif
    return stop_;
}

inline void writeStop(int stop_){
#ifdef _WIN32
    WaitForSingleObject(mutex, INFINITE );
#else
    pthread_mutex_lock(&mutex);
#endif
    stop=stop_;
#ifdef _WIN32
 	ReleaseMutex(mutex);
#else
    pthread_mutex_unlock(&mutex);
#endif
}

int check(__m128i* l, __m128i* h, int m)
{
    int i; //omit init for speed
    alignas(16) unsigned long long c[2]={0};

    __m128i nonce_probe = _mm_set_epi64x(HBITS, HBITS);
    for (i = HASH_LENGTH - m; i < HASH_LENGTH; i++) {
         nonce_probe =  _mm_andnot_si128(_mm_xor_si128(l[i],h[i]),nonce_probe); 
        _mm_store_si128 ((__m128i*)c,nonce_probe);
        if (c[0] == LBITS && c[1] == LBITS) {
            return -1;
        }
    }
     _mm_store_si128 ((__m128i*)c,nonce_probe);
    for (i = 0; i < 64; i++) {
        if ((c[0] >> i) & 1) {
            return i + 0 * 64;
        }
        if ((c[1] >> i) & 1) {
            return i + 1 * 64;
        }
    }
    return -2;
}

int check_AVX(
    __m128i ltrans[STATE_LENGTH],   // immutable
    __m128i htrans[STATE_LENGTH],   // immutable
    int m)
{
    int check;
    __m256i ltrans256, htrans256, lhxor, lhxor_r, nonce_probe_p1, nonce_probe_p2;
    __m128i nonce_probe_p1_h, nonce_probe_p2_h, check128;

    __m256i hbits_256i = _mm256_set_epi64x(HBITS, HBITS, HBITS, HBITS);
    __m256i nonce_probe =  _mm256_set_epi64x(LBITS, LBITS, HBITS, HBITS);

    for (int i = HASH_LENGTH - m; i < HASH_LENGTH; i=i+2) {

        ltrans256 = _mm256_set_m128i(ltrans[i+1], ltrans[i]);
        htrans256 = _mm256_set_m128i(htrans[i+1], htrans[i]);
        lhxor = _mm256_xor_si256(ltrans256, htrans256);

        // cycle1
        nonce_probe_p1 = _mm256_andnot_si256(lhxor, nonce_probe);
        nonce_probe_p1_h = _mm256_extracti128_si256(nonce_probe_p1, 0);

        check = _mm256_testz_si256(_mm256_set_m128i(nonce_probe_p1_h, nonce_probe_p1_h), hbits_256i);
        if (check) {
            return -1;
        }

        // switch filter
        // TODO optimize
        lhxor_r = _mm256_set_m128i(_mm256_extracti128_si256(lhxor, 0), _mm256_extracti128_si256(lhxor, 1));        

        // cycle2
        nonce_probe_p2 = _mm256_andnot_si256(lhxor_r, nonce_probe_p1);
        nonce_probe_p2_h = _mm256_extracti128_si256(nonce_probe_p2, 0);

        check = _mm256_testz_si256(_mm256_set_m128i(nonce_probe_p2_h, nonce_probe_p2_h), hbits_256i);
        if (check) {
            return -1;
        }

        // next cycle
        nonce_probe = _mm256_set_m128i(nonce_probe_p1_h, nonce_probe_p2_h);
    }

    check128 = _mm256_extracti128_si256(nonce_probe, 1);

    // TODO optimize to SIMD
    for (int i = 0; i < 64; i++) {
        if ((check128[0] >> i) & 1) {
            return i + 0 * 64;
        }
        if ((check128[1] >> i) & 1) {
            return i + 1 * 64;
        }
    }
    return -2;
}

long long int loop_cpu(__m128i* lmid, __m128i* hmid, int m, char* nonce)
{
    int n = 0, j = 0;
    long long int i = 0;
    __m128i lcpy[STATE_LENGTH * 2], hcpy[STATE_LENGTH * 2];
    for (i = 0; !incr(lmid, hmid); i++) {
        for (j = 0; j < STATE_LENGTH; j++) {
            lcpy[j] = lmid[j];
            hcpy[j] = hmid[j];
        }
        transform64(lcpy, hcpy);
        if ((n = check(lcpy + STATE_LENGTH, hcpy + STATE_LENGTH, m)) >= 0) {
            seri(lmid, hmid, n, nonce);
            return i * 128;
        }
        int stop_=readStop();
        if (stop_) {
            return -i * 128 - 1;
        }
    }
    return -i * 128 - 1;
}

long long int loop_cpu_AVX(
    __m128i lmid[STATE_LENGTH], // mutable
    __m128i hmid[STATE_LENGTH], // mutable
    int mwm,
    char nonce[HASH_LENGTH])    // mutable
{
    int n = 0, j = 0;
    long long int i = 0;
    __m128i lhcpy[2][2][STATE_LENGTH];

    for (i = 0; !incr_AVX(lmid, hmid); i++) {
        // init
        memcpy(lhcpy[L_IDX], lmid, sizeof(__m128i) * STATE_LENGTH);
        memcpy(lhcpy[H_IDX], hmid, sizeof(__m128i) * STATE_LENGTH);

        transform64_AVX(lhcpy);
        
        if ((n = check_AVX(lhcpy[L_IDX][1], lhcpy[H_IDX][1], mwm)) >= 0) {
            seri(lmid, hmid, n, nonce);
            return i * 128;
        }
        int stop_ = readStop();
        if (stop_) {
            return -i * 128 - 1;
        }
    }
    return -i * 128 - 1;
}

// 01:-1 11:0 10:1
void para(char in[], __m128i l[], __m128i h[])
{
    int i = 0;
    for (i = 0; i < STATE_LENGTH; i++) {
        switch (in[i]) {
        case 0:
            l[i] = _mm_set_epi64x(HBITS, HBITS);
            h[i] = _mm_set_epi64x(HBITS, HBITS);
            break;
        case 1:
            l[i] = _mm_set_epi64x(LBITS, LBITS);
            h[i] = _mm_set_epi64x(HBITS, HBITS);
            break;
        case -1:
            l[i] = _mm_set_epi64x(HBITS, HBITS);
            h[i] = _mm_set_epi64x(LBITS, LBITS);
            break;
        }
    }
}



void incrN128(int n, __m128i* mid_low, __m128i* mid_high)
{
    int i, j;
    __m128i carry;
    for (j = 0; j < n; j++) {
        alignas(16) unsigned long long c[2]={1,1};
        carry = _mm_set_epi64x(HBITS, HBITS);
        for (i = HASH_LENGTH - 7; i < HASH_LENGTH && c[0] ; i++) {
            __m128i low = mid_low[i], high = mid_high[i];
            mid_low[i] = _mm_xor_si128(high,low);
            mid_high[i] = low;
            carry = _mm_andnot_si128(low,high);
            _mm_store_si128 ((__m128i*)c,carry);
        }
    }
}

typedef struct param {
    char* mid;
    int mwm;
    char nonce[HASH_LENGTH];
    int n;
    long long int count;
} PARAM;

#ifdef _WIN32
unsigned __stdcall  pwork_(void* p)
#else
void *pwork_(void* p)
#endif
{
    PARAM* par = (PARAM*)(p);
    __m128i lmid[STATE_LENGTH], hmid[STATE_LENGTH];

    para(par->mid, lmid, hmid);
    lmid[0] = _mm_set_epi64x(LO00, LO01);
    hmid[0] = _mm_set_epi64x(HI00, HI01);
    lmid[1] = _mm_set_epi64x(LO10, LO11);
    hmid[1] = _mm_set_epi64x(HI10, HI11);
    lmid[2] = _mm_set_epi64x(LO20, LO21);
    hmid[2] = _mm_set_epi64x(HI20, HI21);
    lmid[3] = _mm_set_epi64x(LO30, LO31);
    hmid[3] = _mm_set_epi64x(HI30, HI31);
    lmid[4] = _mm_set_epi64x(LO40, LO41);
    hmid[4] = _mm_set_epi64x(HI40, HI41);

    incrN128(par->n, lmid, hmid);
    if (hasAvx2(par->n)) {
        par->count = loop_cpu_AVX(lmid, hmid, par->mwm, par->nonce);
    } else {
        par->count = loop_cpu(lmid, hmid, par->mwm, par->nonce);
    }
    if (par->count >= 0) {
        writeStop(1);
    }
#ifdef _WIN32
    return 0;
#else
    return NULL;
#endif
}

long long int pwork(char tx[], int mwm, char nonce[])
{
    long long int countSSE = 0;
    int i = 0;
    char trits[TX_LENGTH * 3] = { 0 }, mid[STATE_LENGTH] = { 0 };

    tx2trit(tx, trits);
    absorb(mid, trits, TX_LENGTH * 3 - HASH_LENGTH);
    int procs = getCpuNum();
    if (procs>1){
        // procs--;
    }
    fprintf(stderr, "core num:%d\n", procs);
#ifdef _WIN32
    HANDLE *thread = (HANDLE*)calloc(sizeof(HANDLE), procs);
#else
    pthread_t* thread = (pthread_t*)calloc(sizeof(pthread_t), procs);
#endif
    PARAM* p = (PARAM*)calloc(sizeof(PARAM), procs);
    for (i = 0; i < procs; i++) {
        p[i].mid = mid;
        p[i].mwm = mwm;
        p[i].n = i;
#ifdef _WIN32
        unsigned int id=0;
        thread[i] = (HANDLE)_beginthreadex(NULL, 0, pwork_, (LPVOID)&p[i], 0, NULL);
        if (thread[i]==NULL) {
#else
        int ret = pthread_create(&thread[i], NULL, pwork_, &p[i]);
        if (ret != 0) {
#endif
            fprintf(stderr, "can not create thread\n");
            exit(EXIT_FAILURE);
        }
    }
    for (i = 0; i < procs; i++) {
#ifdef _WIN32
        int ret = WaitForSingleObject( thread[i], INFINITE );
        CloseHandle(thread[i]);
        if (ret == WAIT_FAILED) {
#else
        int ret = pthread_join(thread[i], NULL);
        if (ret != 0) {
#endif
            fprintf(stderr, "can not join thread\n");
            exit(EXIT_FAILURE);
        }
        if (p[i].count >= 0) {
            memcpy(nonce, p[i].nonce, HASH_LENGTH);
            countSSE += p[i].count;
        }
        else {
            countSSE += -p[i].count + 1;
        }
    }
    free(thread);
    free(p);

    return countSSE;
}

EXPORT void ccurl_pow_finalize()
{
}

EXPORT void ccurl_pow_interrupt()
{
    if (running)
        writeStop(1);
}



EXPORT char* ccurl_pow(char* trytes, int minWeightMagnitude, RESULT *result)
{
    stop = 0;
    running = 1;
    char nonce_tryte[HASH_LENGTH / 3 + 1] = { 0 }, nonce_trit[HASH_LENGTH] = { 0 };

    time_t start = time(NULL);
    result->count = pwork(trytes, minWeightMagnitude, nonce_trit);
    time_t end = time(NULL);
    result->time = end - start;
   
    hash2tryte(nonce_trit, nonce_tryte);
    memcpy(result->trytes, trytes, TX_LENGTH);
    memcpy(result->trytes + TX_LENGTH - HASH_LENGTH / 3, nonce_tryte, HASH_LENGTH / 3);
    running = 0;
    result->corenum = getCpuNum();
    return result->trytes;
}

void test()
{
    char trits[TX_LENGTH * 3] = { 0 }, hash[HASH_LENGTH / 3 + 1] = { 0 },
                           mid[STATE_LENGTH] = { 0 }, nonce[HASH_LENGTH] = { 0 };
    char tx[] = "TISEZJUUKSTSX9KVQGXSYYLNDIBJDVRZSOFEHWJSDZLNUUNBDLHUODEGFZQTKOEXUMMQTOREUWQCSGGWRKALQDDZCQN9LBIEVKBFDCWBIDWD9DGVOJVCNUNWDDZFCIOICZZF9KIAYDCSKJWE99UPPLUQPUSWTDKTSSTJAQNYATUTXZPA9CCJRRNIRWXTAR9ECVYXC9AOHXHYVOS9LWDUOH9SDUAQBEYTMJIMUHJTGUSQTFPRLLXIDKOVZMONJHXPCD9FYLW9PN9LLPQBJRSEKVKKJB9JRTZCXSDBMJYAKDX99EGNLFZPKIADJQEIMCKRFQKIHGCJAHPL9JFJF9PHRKPCHBPN9LYQSC9TXOXAI9WBDIBNGFPLQS9BHTEVROMCAXXAXPVBAP9URJXIVZXIWWCMVDXGAFZOIRTJIMNIZEPGFMWXWOWRDUMHFRKL9LV9VJQIRZPVJSSKHXHHVZLRZYHGWQAVL9BMWKKFGZQEYJNCGROYYDIDULQVSXGVLTTZRLPSKPVIURJ9CJBTNAYCPHQTWTTKHXPABTYYCCVAZATEVED9PBJQTNOQEQQBTSATZJTVUTZPUWDYKROBROUVSPMDLUMEZWMPESEMQPSVTDZKATUTOAEVWCW9HIKKHMOQYJOUYLTFPERSKBVWARHGJNKUWGFZYF9WSTEHEQWCA9DTOTOTNDFGAEABKKBKEFLDELEOYPZTCVKOBIWA9HWTCQT9IGYVFAFAOLOJMRDZKCBYOCPGEGGZL9CGFURM9FJBLGLZJILNSFOBXLQOZWVLAZUFLGQNCAVJTBGVLZETETWGXLPSPWMMAEGORSDGPUSFRQ9AVWWZCFNKSAHIKJOMEWCCFGVYSDYNIXYYTKJTOKZUGLKNEXHWQ9HVFVJUGJJEDQACTWPSFOONTNCJRDQBSCGXVKWZIGDK9RGHKAHSTOJDJEHIAOF9MFLAZJXLUGQUAUGKQGQIXXNLAPRQNTNVDGXVZBSEFXVRR9ZQIZEWPXZFMXLJFTFKEPPAFJTMBLBWYAWJEIHUNATL9EHIJQTCCMQFHILGHGEVXKHDCNMAHDPUGBQYYBF9CRIKDVZZ9KIFELUUKPXPRIFVTZPXRBKJBRLEGUJKXZPYGXRKOAHROFXENAUAYOSQBJGMMHIDUNSYYGQSDJDKMPNBPTUWMIYZCWABYLDMTXAGWFYEXRGLOYVPNSOVYITEPCXMTMPVLBQPBNQUBITEM99KVRTPNAAWPR9RQYBLFZDVWYDJXQRGTVAFVE99KE9YSCETBIELIWPKZYFARSPVLTDKEAKLCKULZHLKOQZMVLFLF9QHT9LLS9QQODSFYUIPKSBVSKAJMVW9QUILQSKHZMAXGVHUJBMTATPIDHJVUBZWUOYNOOMEJVOUXHACUHDVKZ9ZDTSIHQOTOVUMEISMA9VZIFQTPBXXDHDLVLKZZHLYLPIE9SKOEJXAFDKICOYIOVVAEXC9VZSFSDTSHVEOSHIT9JHMBBPQTRGOREIYQSBCMHJQIXTTQWOCKMCSGBRTJRRYWPXAGELIFPG9YX9FNNYGSJXJYTHIMWSXZH9JQIYXKFXEOHOE9YNHJIDAJUGPENZHOIFEHBSCQITVFHUOESVXOJPCNTUZR9LVQCXYUW9DITEXPG9KWYMBZQQCESNFVUOBQGCRRKFHOEKTHDHUNRXADXUMCWFJMZTMHN9VWLZATB9FF9HBGLFITNNVFCQICPRSGVFAATWYJT9GUJIAHNNJBECYSWSGEJYLHJPUOYESLVIELBMSLRZJLPKDKFGAJSSWZCQDLFDEXWAPILHLNHKCRMPLQUYESAEIWWNBCEIYSOHKPILTXPAFIZ9JMKFKJHTLHRHGZQLCEVJJMJHWTUKMKOWTZWGVZGQAOAKVGXZEZBMYPVWUGYJBIFXBACZLADFFBZIXKWSZLDOCGRQAZDCFPRAZYXUMNRJ9UKUKRAVSVMCENDJABZITDQLNCXZNXCOHKLATFFXKP9FFDYSAXISISMVYPXPWYPVEAYRNAITWJSTGXRAMMZIZF9IUORREWSFUNZOXDVCMBZJAET9PVHCQTMDTVVXLXDIXFSHPXWKBZBDJAAXSDEFXPARBU9GJJABPMCD9LGQJLRIYKGQORGCDDABAIAQC9MZDQLXFSAOLNYMWCJODEEUSIHEVHQPAIFQL9ECBBVZPHYU9HDBOYXTKWOIRGHUJMVV9UKHHREDIU9CRZFUZKAMUVRIEMKEKIMAGXSMGTEJWCWWAMRPWNINTETOTRMODTORVEURRY9RTDYQIEW99999999999999999999999999999999999999999999CMRKHWD99A99999999C99999999TNFAKVBFHHMKQKKSNJRLDIYUIGOMEOADJLNS9JGKGUIHZHIUDNQMVYCA9SZCLQOEVJPUGQGWTMETLGMUQMAKHHHHTBHVWYSJSXRVBRMHVV9WUTNMNFVDWLHQGFELTKZOISREPUJXNRBIAQVQWCCKB9DEZEXS999999M9EZGRXJ9WYSZXNDZBAJZMJ9VAMUWWWANGIVFKCUNRB9GLZZKRIMEFUK9KEFZXYDGBQJIU9SQUM999999999999999999999999999999999999999999999999999999999999999999999999999999999999999" ;

    tx2trit(tx, trits);
    absorb(mid, trits, TX_LENGTH * 3);
    hash2tryte(mid, hash);
    if (strcmp(hash, "IPQYUNLDGKCLJVEJGVVISSQYVDJJWOXCW9RZXIDFKMBXDVZDXFBZNZJKBSTIMBKAXHFTGETEIPTZGNTJK")) {
        fprintf(stderr, "hash not match %s\n", hash);
    }

    int m = 18;

    struct timeval start;	
    gettimeofday(&start, NULL);

    long long int cnt = pwork(tx, m, nonce);
    
    struct timeval end;	
    gettimeofday(&end, NULL);

    time_t diffsec = difftime(end.tv_sec, start.tv_sec);
    suseconds_t diffsub = end.tv_usec - start.tv_usec;
    double realsec = diffsec + diffsub * 1e-6;

    printf("count=%lld sec=%8.6lf kHash/sec: %lld \n", cnt, realsec, (long long int)((double)(cnt / 1e3) / realsec));

    memcpy(trits + TX_LENGTH * 3 - HASH_LENGTH, nonce, HASH_LENGTH);
    memset(mid, 0, STATE_LENGTH);
    absorb(mid, trits, TX_LENGTH * 3);
    hash2tryte(mid, hash);
    fprintf(stderr, "PoWed hash is %s\n", hash);

    if (strcmp(hash + HASH_LENGTH / 3 - m / 3, "99999")) {
        fprintf(stderr, "PoW is incorrect. %s\n", hash);
        exit(1);
    }
    fprintf(stderr, "OK\n");
}

int main(int argc, char* argv[])
{
    test();
}
